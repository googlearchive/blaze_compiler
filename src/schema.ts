require('source-map-support').install();

import blaze = require('./blaze');
import expression = require('../src/expression');
import tv4 = require('tv4');
import fs = require('fs');
import Json  = require('source-processor');
import error  = require('source-processor');
import optimizer = require('../src/optimizer');
import globals = require('../src/globals');

//todo
//refactor out traversals
var debug_metaschema_validation = false;

/**
 * performs a bottom up traversal of a schema definition, allowing each metaschema processor
 * to generate constraints
 */
export function annotate(model: blaze.Rules){
    model.schema.root = annotate_schema(model.schema.json, null, null, new SchemaAPI(), model)
}

/**
* pushes ancestors schema constraints to being explicitly being represented in leaf nodes
* this is done by leaves being the && concatenation of all ancestors
* next in a parent's context is next.parent() in the child context
*/
export function pushDownConstraints(model:blaze.Rules){
    model.schema.root.pushDownConstraints(model.functions, null);
}

/**
* pulls full leaf schema constraints upwards. ancestors constraints are overwritten
* by the && concatenation of all children
*/
export function pullUpConstraints(model:blaze.Rules){
    model.schema.root.pullUpConstraints(model.functions, "");
}

/**
* intergrates the ACL constraints into the schema
*/
export function combineACL(model:blaze.Rules){
    model.schema.root.combineACL(model.functions, model.access, []);
}

/**
* intergrates the ACL constraints into the schema
*/
export function generateRules(model:blaze.Rules){
    var buffer:string[] = [];
    buffer.push('{\n');
    buffer.push('  "rules":');

    var symbols = new expression.Symbols();
    symbols.loadFunction(model.functions);

    model.schema.root.generate(symbols, "  ", buffer, false);
    buffer.push('}\n');
    //convert buffer into big string
    var code: string = buffer.join('');
    return code;
}

/**
 * main model class for schema tree, all schema nodes are parsed into this format by annotate
 */
export class SchemaNode{

    static KEY_PATTERN:string = ".*"; //regex for patterns

    type: string;
    properties: {[name:string]:SchemaNode} = {};
    constraint: expression.Expression;
    write: expression.Expression;
    read: expression.Expression;
    additionalProperties: boolean;
    node: any;
    examples: Json.JArray;
    nonexamples: Json.JArray;
    indexOn: string[];

    constructor(node:any){
        this.node = node;
    }

    isLeaf(): boolean{
        return Object.keys(this.properties).length == 0;
    }

    generate(symbols: expression.Symbols, prefix: string, buffer: string[], use_validation: boolean): string[]{
        buffer.push('{\n');

        if (this.indexOn.length > 0){
            buffer.push(prefix + '  ".indexOn": ["' + this.indexOn.join('", "') + '"],\n');
        }

        buffer.push(prefix + '  ".write":"');
        buffer.push(optimizer.escapeEscapes(this.write.generate(symbols)));
        buffer.push('",\n');

        if (use_validation) {
            //validation is repeated for wilderchilds, so the child constraints fire (when not null)
            //even when parent is set
            buffer.push(prefix + '  ".validate":"');
            buffer.push(optimizer.escapeEscapes(this.write.generate(symbols)));
            buffer.push('",\n');
        }

        buffer.push(prefix + '  ".read":"');
        buffer.push(optimizer.escapeEscapes(this.read.generate(symbols)));
        buffer.push('",\n');

        var comma_in_properties = false;
        //recurse
        for (var property in this.properties){
            if (property.indexOf("~$") == 0) {
                //nullable wildchild
                var name = property.substr(1);
                var use_validation_child = true;
            } else {
                //normal wildchilds and fixed properties
                var name = property;
                var use_validation_child = false;
            }

            buffer.push(prefix + '  "' + name + '": ');
            this.properties[property].generate(symbols, prefix + "  ", buffer, use_validation_child);
            buffer.pop(); //pop closing brace and continue with comma
            buffer.push('},\n');
            comma_in_properties = true;
        }

        if (!this.additionalProperties){
            buffer.push(prefix + '  "$other":{".validate":"false"');
            buffer.push('GETS REMOVED BY CODE BELOW');
            comma_in_properties = true;
        }

        //remove last trailing comma
        if (comma_in_properties){
            buffer.pop();
            buffer.push("}\n");
        } else {
            //else the comma was placed last at the ".read" statement
            buffer.pop();
            buffer.push('"\n');
        }

        buffer.push(prefix);
        buffer.push("}\n");

        return buffer;
    }

    /**
     * moves ancestors constraints to being explicitly being represented in leaf nodes
     * this is done by leaves being the && concatenation of all ancestors
     * next in a parent's context is next.parent() in the child context
     */
    pushDownConstraints(functions: expression.Functions, inherited_clause:expression.Expression) {
        var symbols: expression.Symbols = new expression.Symbols();
        symbols.loadFunction(functions);

        if(inherited_clause != null){
            this.constraint = expression.Expression.parse(
                "(" + inherited_clause.rewriteForChild()  +
                ")&&(" +
                this.constraint.expandFunctions(symbols) + ")");
        }

        //recurse last for top down
        for(var property in this.properties){
            this.properties[property].pushDownConstraints(functions, this.constraint)
        }
    }

    pullUpConstraints(functions: expression.Functions, child_name):string{
        if(this.isLeaf()) return this.constraint.rewriteForParent(child_name);

        var symbols: expression.Symbols = new expression.Symbols();
        symbols.loadFunction(functions);
        var children_clauses:string = this.constraint.expandFunctions(symbols);

        //recurse first for bottom up
        for(var property in this.properties){
            children_clauses =
                "(" +children_clauses+
                ") && (" +
                this.properties[property].pullUpConstraints(functions, property) + ")"
        }

        this.constraint = expression.Expression.parse(children_clauses);

        return this.constraint.rewriteForParent(child_name);
    }

    combineACL(functions: expression.Functions, acl: blaze.Access, location: string[]){
        //console.log("combineACL", location);

        var write:string = "false";
        var read: string = "false";

        var symbols: expression.Symbols = new expression.Symbols();
        symbols.loadFunction(functions);

        //work out what ACL entries are active for this node by ORing active entries clauses together
        for(var idx in acl){
            var entry: blaze.AccessEntry = acl[idx];

            if(entry.match(location)){
                write = "(" + write + ")||(" + entry.getWriteFor(symbols, location).raw + ")";
                read  = "(" + read  + ")||(" + entry.getReadFor(symbols, location).raw + ")";
            }
        }

        //combine the write rules with the schema constraints
        this.write = expression.Expression.parse("(" + this.constraint.raw + ")&&(" + write + ")");
        this.read  = expression.Expression.parse(read);

        //recurse
        for(var property in this.properties){
            var child_location: string[] = location.concat(<string>property);
            this.properties[property].combineACL(functions, acl, child_location);
        }
    }

    getWildchild():string {
        return getWildchild(this.node).value;
    }
}

export class MetaSchema{
    validator: Json.JValue; //json schema json used for validation of type

    compile:(api:SchemaAPI) => void; //function used to generate type specific constraints

    validate(data: Json.JValue): boolean{
        if (debug_metaschema_validation) {
            console.log("validating data");
            console.log(data.toJSON());
            console.log("with schema");
            console.log(this.validator.toJSON());
        }

        var valid =  tv4.validate(data.toJSON(), this.validator.toJSON(), true, true);

        if(!valid){
            throw error.validation(
                data,
                this.validator,
                "schema node",
                "type schema",
                tv4.error
            ).source(data).on(new Error())
        } else {
            if (debug_metaschema_validation) console.log("passed validation");
        }


        if(tv4.getMissingUris().length != 0){
            throw error.message("missing $ref definitions: " + tv4.getMissingUris()).source(data).on(new Error());
        }

        return valid;
    }

    static parse(json: Json.JValue): MetaSchema{
        var result:MetaSchema = new MetaSchema();
        result.validator = json.getOrThrow("validator", "no validator defined for the metaschema");
        result.compile = <(api:SchemaAPI) => void>new Function("api",
            json.getOrThrow("compile", "no compile defined for the metaschema").asString().value);

        return result;
    }
}


function annotate_schema(node: Json.JValue, parent: Json.JValue, key: string, api: SchemaAPI, model: blaze.Rules): SchemaNode {
    if (node.has("$ref")) {
        //we should replace this node with its definition
        node = fetchRef(node.getOrThrow("$ref", "").coerceString().value, model);

        if (key.indexOf("$") == 0 || key.indexOf("~$") == 0) {
            parent.asObject().put(new Json.JString(key, -1, -1), node)
        } else {
            parent.asObject().getOrThrow("properties", "no properties defined above reference with key:" + key).asObject().put(new Json.JString(key, -1, -1), node)
        }
    }

    var annotation = new SchemaNode(node);

    //recurse to children first in bottom up
    if (node.has("properties")) {
        node.getOrThrow("properties", "").asObject().forEach(
            function(name: Json.JString, child: Json.JValue){
                if (name.value.indexOf("$") == 0 || name.value.indexOf("~$") == 0) throw error.message(
                    "properties cannot start with $ or ~$, you probably want a wild(er)child which is not declared in the properties section"
                ).source(name).on(new Error());

                annotation.properties[name.value] = annotate_schema(child, node, name.getString(), api, model);
            });
    }

    if (globals.debug) console.log("annotate_schema", node.toJSON());

    //wildchilds need special treatment as they are not normal properties but still schema nodes
    if (getWildchild(node)){
        //add them as a property annotation
        var wildname = getWildchild(node).value;
        var wildkey  = getWildchild(node);

        annotation.properties[wildname] = annotate_schema(
            node.getOrThrow(wildname, "cant find wildchild"),
            node, wildname, api, model);
        //we also convert them into a pattern properties and add it to the JSON schema node so examples can pass
        var patternProperties = new Json.JObject();

        //so we move the wildchild from the root of the schema declaration,
        //into a child of patternProperties so that the JSON schema validator can read it like a pattern
        //accepting any property without saying its not declared
        node.asObject().put(
            new Json.JString("patternProperties", wildkey.start.position, wildkey.end.position),
            patternProperties);

        patternProperties.put(
            new Json.JString(SchemaNode.KEY_PATTERN, 0,0),
            node.getOrThrow(wildname, "cant find wildchild"));
    } else {
        //console.log("no wildchild")
    }

    //fill in all defaults for a schema node
    api.setContext(node, parent, annotation, model);
    annotation.type = node.has("type") ? node.getOrThrow("type", "").asString().value: "any";

    if (!node.has("constraint")) {
         node.asObject().put( //synthetically place a constraint in the user source so the SchemaAPI can extend it
             new Json.JString("constraint", 0,0),
             new Json.JString("true", 0,0)
         )
    }

    annotation.additionalProperties = //objects are allowed extra properties by default
        node.has("additionalProperties") ?
            node.getOrThrow("additionalProperties", "").asBoolean().value : true;

    annotation.examples = node.has("examples") ?
        node.asObject().getOrThrow("examples", "").asArray(): new Json.JArray();

    annotation.nonexamples = node.has("nonexamples") ?
        node.asObject().getOrThrow("nonexamples", "").asArray(): new Json.JArray();

    annotation.indexOn = []; //get indexOn, whether specified as a single string or an array
    if (node.has("indexOn")) {
        var index: Json.JValue = node.asObject().getOrThrow("indexOn", "");
        if (index.type == Json.JType.JString) {
            annotation.indexOn = [index.asString().value]
        } else {
            index.asArray().forEach(function (val) {
                annotation.indexOn.push(val.asString().value)
            })
        }
    }

    //using type information, the metaschema is given an opportunity to customise the node with type specific keywords

    if (api.metaschema[annotation.type] != undefined){
        if (api.metaschema[annotation.type].validate(node)){
            //the user compile could actually add more nodes, see schemaAPI.addProperty
            //if this happens annotate_schema needs to be called for new nodes
            //entering the system pragmatically in compile (done in addProperty)
            api.metaschema[annotation.type].compile(api);
        } else {
            throw error.validation(
                node,
                api.metaschema[annotation.type].validator,
                "subtree",
                "annotation.type",
                tv4.error
            ).on(new Error());
        }
    } else {
        throw error.source(node).message("unknown type '" + annotation.type + "' no metaschema to validate it").on(new Error());
    }

    //we parse the constraint after the api has processed it
    //as it might have changed the constraints as part of its domain
    annotation.constraint = expression.Expression.parseUser(
        node.asObject().getOrThrow("constraint", "no constraint defined").coerceString()
    );

    //if the user has supplied examples or non examples, the validity of these are checked

    annotation.examples.forEach(function(example: Json.JValue){
        var valid = tv4.validate(example.toJSON(), node.toJSON(), true, false);
        if(!valid){
            throw error.validation(
                example,
                node,
                "example",
                "schema",
                tv4.error
            ).on(new Error());
        }
    });

    annotation.nonexamples.forEach(function(nonexample: Json.JValue){
        var valid = tv4.validate(nonexample.toJSON(), node.toJSON(), true, false);
        if(valid){
            throw error.message("nonexample erroneously passed").source(nonexample).on(new Error());
        }
    });

    return annotation;
}

export function fetchRef(url:string, model:blaze.Rules): Json.JValue{
    //todo: this should probably be routed through tv4's getSchema method properly

    //code nicked from tv4.getSchema:
    var baseUrl = url; //not interested in yet
	var fragment = "";
	if (url.indexOf('#') !== -1) {
		fragment = url.substring(url.indexOf("#") + 1);
		baseUrl = url.substring(0, url.indexOf("#"));
	}
    var pointerPath = decodeURIComponent(fragment);

    if (pointerPath.charAt(0) !== "/") {
        throw error.message("$ref URL not starting with / or #/ " + url).on(new Error())
    }

    var parts = pointerPath.split("/").slice(1);
    var schema:Json.JValue = model.schema.json; //navigate user source

    for (var i = 0; i < parts.length; i++) {
        var component: string = parts[i].replace(/~1/g, "/").replace(/~0/g, "~");
        schema = schema.getOrThrow(component,
            [
                JSON.stringify(schema.toJSON()),
                "could not find schema at " + component + " of " + pointerPath,

            ].join("\n"))
    }

    if (globals.debug) console.log("fetchRef" + url + " retrieved " + JSON.stringify(schema.toJSON()));

    return schema;
}
/**
 * provides hooks for meta-data to pragmatically generate constraints and functions
 */
export class SchemaAPI{
    metaschema:{[name:string]:MetaSchema} = {};

    link:  Json.JValue;  //we provide a pointer to the live representation, so we can updated it
    node:   any;         //local context for api application,  a raw JSON, for presentation to the meta-schema author
    parent: any;         //local context for api application, also a raw JSON and it should not be updated
    annotationInProgress: SchemaNode; //local context for api application
    model: blaze.Rules;

    constructor(){
        //load all built in schema definitions from schema directory
        var files = fs.readdirSync(blaze.root + "schema/metaschema");
        for(var i in files){
            if (!files.hasOwnProperty(i)) continue;
            var path = blaze.root + "schema/metaschema"+'/'+files[i];
            var metaschema_def = blaze.load_yaml(path);

            var typename: string = metaschema_def.getOrThrow("name", "meta-schema is not named in: " + path).asString().value;

            console.log("loading type " + typename + " definition from " + path);
            this.metaschema[typename] = MetaSchema.parse(metaschema_def);
        }
    }

    /**
     * before the metaschema is given a hook for adding constraints, this method is called to
     * point the api at the right schema instances
     * @param node
     * @param parent
     * @param annotationInProgress
     */
    setContext(node: Json.JValue, parent: Json.JValue, annotationInProgress: SchemaNode, model: blaze.Rules){
        this.link = node;
        this.node = this.link.toJSON();
        this.parent = parent == null ? null : parent.toJSON();
        this.annotationInProgress = annotationInProgress;
        this.model = model;
    }

    /**
     * User method for adding a type specific constraint, the constraint is &&ed to the current constraints
     */
    addConstraint(expression:string): void {
        if (globals.debug) console.log("addConstraint " + expression);
        this.link.asObject().put(
            new Json.JString("constraint", 0,0),
            new Json.JString(
                    "("+
                    this.link.getOrThrow("constraint", "constraint not defined").coerceString().value +
                    ") && (" +
                    expression + ")", 0,0)

        )
    }

    /**
     * User method for dynamically adding a property as a schema node
     */
    addProperty(name:string, json:any):void{
        throw new Error("redo since refactor, not reflecting change from raw json to Json.JValue");
        this.node[name] = json;

        //as this is called through compile, which is part way through the annotation,
        //this new node would be over looked, so we need call the annotation routine explicitly out of turn
        var extra_annotator = new SchemaAPI();
        extra_annotator.setContext(json, this.node, this.annotationInProgress, this.model);

        this.annotationInProgress.properties[name] = annotate_schema(json, this.node, name, extra_annotator, this.model);
    }

    /**
     * User method for read access to schema fields
     * returns null if the field is not present
     * specifying type ('array', 'object', 'string', 'boolean', 'number') is optional
     */
    getField(name:string, type: string): any{
        if(globals.debug) console.log("getField on", name, "result:", this.node[name], this.node);
        if(this.node[name] == null) return null;

        //so the field is present, now we check the type
        if (type !== undefined) {
            if(type == 'array') {
                return this.link.getOrThrow(name, "").asArray().toJSON
            } else if(type == 'object') {
                return this.link.getOrThrow(name, "").asObject().toJSON
            } else if(type == 'string') {
                return this.link.getOrThrow(name, "").asString().toJSON
            } else if(type == 'boolean') {
                return this.link.getOrThrow(name, "").asBoolean().toJSON
            } else if(type == 'number') {
                return this.link.getOrThrow(name, "").asNumber().toJSON
            } else {
                throw error.message("unrecognised type specified: " + type).on(new Error())
            }
        }

        return this.node[name];
    }

    /**
     * user method for retrieving the wildchild's name for this node
     * call getField(getWildchild()) if you want the wildchilds schema node
     * @returns {string}
     */
    getWildchild(): string{
        return getWildchild(this.node).value
    }
}

export function getWildchild(node: Json.JValue): Json.JString{
    var wildchild: Json.JString = null;
    node.asObject().forEach(
        function(keyword: Json.JString, child: Json.JValue){
            var name: string = keyword.value;
            if (name.indexOf("$") == 0 || name.indexOf("~$") == 0) {
                if(wildchild == null) wildchild = keyword;
                else{
                    throw error.message("multiple wildchilds defined:\n").source(node).on(new Error())
                }
            }
        });
    return wildchild;
}

