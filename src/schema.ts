import blaze = require('./blaze');
import expression = require('../src/expression');

import tv4 = require('tv4');
import fs = require('fs');

//todo
//refactor out traversals
var debug = true;

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
    model.schema.root.pushDownConstraints(null);
}

/**
* pulls full leaf schema constraints upwards. ancestors constraints are overwritten
* by the && concatenation of all children
*/
export function pullUpConstraints(model:blaze.Rules){
    model.schema.root.pullUpConstraints("");
}

/**
* intergrates the ACL constraints into the schema
*/
export function combineACL(model:blaze.Rules){
    model.schema.root.combineACL(model.access, []);
}

/**
* intergrates the ACL constraints into the schema
*/
export function generateRules(model:blaze.Rules){
    var buffer:string[] = [];
    buffer.push('{\n');
    buffer.push('  "rules":');

    var symbols = new expression.Symbols();
    symbols.loadPredicate(model.predicates);

    model.schema.root.generate(symbols, "  ", buffer);
    buffer.push('}\n');
    //convert buffer into big string
    var code:string = buffer.join('');
    return code;
}

/**
 * main model class for schema tree, all schema nodes are parsed into this format by annotate
 */
export class SchemaNode{

    static KEY_PATTERN:string = ".*"; //regex for patterns

    type: string;
    properties:{[name:string]:SchemaNode} = {};
    constraint:expression.Expression;
    write:expression.Expression;
    read: expression.Expression;
    additionalProperties: boolean;
    node:any;
    examples:any[];
    nonexamples:any[];

    constructor(node:any){
        this.node = node;
    }

    isLeaf():boolean{
        return Object.keys(this.properties).length == 0;
    }
    generate(symbols:expression.Symbols, prefix:string, buffer:string[]):string[]{
        buffer.push('{\n');

        buffer.push(prefix + '  ".write":"');
        buffer.push(this.write.generate(symbols));
        buffer.push('",\n');
        buffer.push(prefix + '  ".read":"');
        buffer.push(this.read.generate(symbols));
        buffer.push('",\n');

        var comma_in_properties = false;
        //recurse
        for (var property in this.properties){
            buffer.push(prefix + '  "' + property + '": ');
            this.properties[property].generate(symbols, prefix + "  ", buffer)

            buffer.pop(); //pop closing brace and continue with comma
            buffer.push('},\n');
            comma_in_properties = true;
        }

        if (!this.additionalProperties){
            buffer.push(prefix + '  "$other":{".validate":"false"');
            buffer.push('GETS REMOVED');
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
    pushDownConstraints(inherited_clause:expression.Expression){
        if(inherited_clause != null){
            this.constraint = expression.Expression.parse(
                "(" + inherited_clause.rewriteForChild()  +
                ")&&(" +
                this.constraint.raw + ")");
        }

        //recurse last for top down
        for(var property in this.properties){
            this.properties[property].pushDownConstraints(this.constraint)
        }
    }

    pullUpConstraints(child_name):string{
        if(this.isLeaf()) return this.constraint.rewriteForParent(child_name);

        //recurse first for bottom up
        var children_clauses:string = "true";

        for(var property in this.properties){
            children_clauses =
                "(" +children_clauses+
                ") && (" +
                this.properties[property].pullUpConstraints(property) + ")"
        }

        this.constraint = expression.Expression.parse(children_clauses);

        return this.constraint.rewriteForParent(child_name);
    }

    combineACL(acl:blaze.Access, location:string[]){
        //console.log("combineACL", location);

        var write:string = "false";
        var read: string = "false";

        //work out what ACL entries are active for this node by ORing active entries clauses together
        for(var idx in acl){
            var entry:blaze.AccessEntry = acl[idx];

            if(entry.match(location)){
                write = "(" + write + ")||(" + entry.write.raw + ")";
                read  = "(" + read  + ")||(" + entry.read.raw  + ")";
            }
        }

        //combine the write rules with the schema constraints
        this.write = expression.Expression.parse("(" + this.constraint.raw + ")&&(" + write + ")");
        this.read  = expression.Expression.parse(read);

        //recurse
        for(var property in this.properties){
            var child_location: string[] = location.concat(<string>property);
            this.properties[property].combineACL(acl, child_location);
        }
    }

    getWildchild():string{
        return getWildchild(this.properties);
    }
}

export class MetaSchema{
    validator:any; //json schema json used for validation of type

    compile:(api:SchemaAPI) => void; //function used to generate type specific constraints

    validate(node:any):boolean{

        var valid =  tv4.validate(node, this.validator, true, true);

        if(!valid){
            console.log("could not validate");
            console.log(JSON.stringify(node));
            console.log("with the validator");
            console.log(JSON.stringify(this.validator));
            console.log(tv4.error)
        }


        if(tv4.getMissingUris().length != 0){
            console.log(tv4.getMissingUris());
            return false;
        }


        return valid;
    }

    static parse(json:any):MetaSchema{
        var result:MetaSchema = new MetaSchema();
        result.validator = json.validator;
        result.compile = <(api:SchemaAPI) => void>new Function("api",json.compile);

        return result;
    }
}


function annotate_schema(node:any, parent:any, key:string, api:SchemaAPI, model:blaze.Rules):SchemaNode {
    if(debug) console.log("annotate_schema", node);

    if(node["$ref"]){
        //we should replace this node with its definition
        node = fetchRef(node["$ref"], model);
    }

    var annotation = new SchemaNode(node);

    //recurse to children first in bottom up
    for(var key in node.properties){
        annotation.properties[key] = annotate_schema(node.properties[key], node, key, api, model);
    }

    //wildchilds need special treatment as they are not normal properties but still schema nodes
    if(getWildchild(node)){
        //add them as a property annotation
        annotation.properties[getWildchild(node)] = annotate_schema(node[getWildchild(node)], node, key, api, model);
        //we also convert them into a pattern properties and add it to the JSON schema node so examples can pass
        node.patternProperties = {};
        node.patternProperties[SchemaNode.KEY_PATTERN] = node[getWildchild(node)];
    }


    api.setContext(node, parent, annotation, model);
    annotation.type = node.type ? node.type:null;
    node.constraint = node.constraint ? node.constraint:"true"; //default to true for constraint
    annotation.additionalProperties = node.additionalProperties === undefined? true: node.additionalProperties;
    annotation.examples = node.examples? node.examples:[];
    annotation.nonexamples = node.nonexamples? node.nonexamples:[];

    //using type information, the metaschema is given an opportunity to customise the node
    if(annotation.type == null) annotation.type = "any";

    if(api.metaschema[annotation.type] != undefined){
        if(api.metaschema[annotation.type].validate(node)){
            //the user compile could actually add more nodes, see schemaAPI.addProperty
            //if this happens annotate_schema needs to be called for new nodes
            //entering the system pragmatically in compile (done in addProperty)
            api.metaschema[annotation.type].compile(api);
        }else{
            throw new Error("type validation failed: " + JSON.stringify(node));
        }
    }else{
        console.error("unknown schema type:", annotation.type);
        throw new Error("unknown type specified");
    }

    annotation.constraint = expression.Expression.parse(node.constraint);

    //if the user has supplied examples or non examples, the validity of these are checked
    for(var example_index in annotation.examples){
        var example = annotation.examples[example_index];

        var valid = tv4.validate(example, node, true, false);
        if(!valid){
            console.error(tv4.error);
            throw new Error("example failed " + JSON.stringify(example) + " on " + JSON.stringify(node));
        }
    }

    for(var nonexample_index in annotation.nonexamples){
        var nonexample = annotation.nonexamples[nonexample_index];

        var valid = tv4.validate(nonexample, node, true, false);
        if(valid){
            throw new Error("nonexample erroneously passed " + JSON.stringify(nonexample) + " on " + JSON.stringify(node));
        }
    }


    return annotation;
}

export function fetchRef(url:string, model:blaze.Rules):any{
    //todo: this should probably be routed through tv4's getSchema method properly
    //console.log("fetchRef" + url);

    //code nicked from tv4.getSchema:
    var baseUrl = url; //not interested in yet
	var fragment = "";
	if (url.indexOf('#') !== -1) {
		fragment = url.substring(url.indexOf("#") + 1);
		baseUrl = url.substring(0, url.indexOf("#"));
	}
    var pointerPath = decodeURIComponent(fragment);

    if (pointerPath.charAt(0) !== "/") {
        return undefined;
    }

    var parts = pointerPath.split("/").slice(1);
    var schema = model.schema.json; //navigate raw json

    for (var i = 0; i < parts.length; i++) {
        var component = parts[i].replace(/~1/g, "/").replace(/~0/g, "~");
        if (schema[component] === undefined) {
            schema = undefined;
            break;
        }
        schema = schema[component];
    }

    if(schema == undefined) throw new Error("could not find definition: " + url);

    return schema;


}
/**
 * provides hooks for meta-data to pragmatically generate constraints and predicates
 */
export class SchemaAPI{
    metaschema:{[name:string]:MetaSchema} = {};

    node: any;   //local context for api application
    parent: any; //local context for api application
    annotationInProgress: SchemaNode; //local context for api application
    model: blaze.Rules;

    constructor(){
        //load all built in schema definitions from schema directory
        var files = fs.readdirSync(blaze.root + "schema/metaschema");
        for(var i in files){
            if (!files.hasOwnProperty(i)) continue;
            var name = blaze.root + "schema/metaschema"+'/'+files[i];
            var metaschema_def = blaze.load_yaml(name);

            console.log("loading built in type", metaschema_def.name, "into metaschema");

            this.metaschema[metaschema_def.name] = MetaSchema.parse(metaschema_def);
        }
    }

    /**
     * before the metaschema is given a hook for adding constraints, this method is called to
     * point the api at the right schema instances
     * @param node
     * @param parent
     * @param annotationInProgress
     */
    setContext(node:any, parent:any, annotationInProgress:SchemaNode, model: blaze.Rules){
        this.node = node;
        this.parent = parent;
        this.annotationInProgress = annotationInProgress;
        this.model = model;
    }

    /**
     * User method for adding a type specific constraint, the constraint is &&ed to the current constraints
     */
    addConstraint(expression:string):void{
        this.node.constraint = "("+ this.node.constraint + ") && (" + expression + ")";
    }

    /**
     * User method for dynamically adding a property as a schema node
     */
    addProperty(name:string, json:any):void{
        this.node[name] = json;

        //as this is called through compile, which is part way through the annotation,
        //this new node would be over looked, so we need call the annotation routine explicitly out of turn
        var extra_annotator = new SchemaAPI();
        extra_annotator.setContext(json, this.node, this.annotationInProgress, this.model);

        this.annotationInProgress.properties[name] = annotate_schema(json, this.node, name, extra_annotator, this.model);
    }

    /**
     * User method for read access to schema fields
     */
    getField(name:string):any{
        return this.node[name];
    }

    /**
     * user method for retrieving the wildchild's name for this node
     * call getField(getWildchild()) if you want the wildchilds schema node
     * @returns {string}
     */
    getWildchild():string{
        return getWildchild(this.node)
    }
}

function getWildchild(node:any):string{
    var wildchild:string = null;
    for(var name in node){
        if(name.indexOf("$") == 0){
            if(wildchild == null) wildchild = name;
            else{
                throw Error("more than one wildchild defined")
            }
        }
    }
    return wildchild;
}

