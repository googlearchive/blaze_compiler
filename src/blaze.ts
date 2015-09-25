/// <reference path="../types/js-yaml.d.ts" />
/// <reference path="../types/node.d.ts" />
/// <reference path="../src/expression.ts" />
/// <reference path="../node_modules/source-processor/index.d.ts" />
require('source-map-support').install();

import fs = require("fs");
import tv4 = require('tv4');
import expression = require('../src/expression');
import schema = require('../src/schema');
import path = require('path');
import Json = require('source-processor');
import error = require('source-processor');

export var debug = false;
/**
 * synchronously loads a file resource, converting from YAML to JSON
 * @param filepath location on filesystem
 */
export function load_yaml(filepath: string): Json.JValue{
    var yaml_text = fs.readFileSync(filepath, {encoding: 'utf8'}).toString();
    return Json.parse_yaml(yaml_text);
}

export function load_json(filepath: string): Json.JValue{
    var json_text = fs.readFileSync(filepath, {encoding: 'utf8'}).toString();
    return Json.parse(json_text);
}

/**
 * synchronously loads a file resource, converting from multi document YAML to a callback with a JSON param
 */
export function load_yaml_collection(filepath: string, cb:(json: Json.JValue) => void):void{
    var yaml_text = fs.readFileSync(filepath, {encoding: 'utf8'}).toString();
    Json.parse_yaml_collection(yaml_text, cb);
}

export var root:string = path.dirname(fs.realpathSync(__filename)) + "/../";
export var rules_schema: Json.JValue = load_yaml(root + "schema/security_rules.yaml");

export function validate_rules(rules: Json.JValue): boolean{
    tv4.addSchema("http://firebase.com/schema/types/object#", this.load_yaml(root + "schema/types/object.yaml").toJSON());
    tv4.addSchema("http://firebase.com/schema/types/string#", this.load_yaml(root + "schema/types/string.yaml").toJSON());
    tv4.addSchema("http://firebase.com/schema/types/boolean#",this.load_yaml(root + "schema/types/boolean.yaml").toJSON());
    tv4.addSchema("http://firebase.com/schema/types/number#", this.load_yaml(root + "schema/types/number.yaml").toJSON());
    tv4.addSchema("http://firebase.com/schema/types/any#",    this.load_yaml(root + "schema/types/any.yaml").toJSON());

    tv4.addSchema("http://firebase.com/schema#", this.load_yaml(root + "schema/schema.yaml").toJSON());
    tv4.addSchema("http://json-schema.org/draft-04/schema#", fs.readFileSync(root + "schema/jsonschema", {encoding: 'utf8'}).toString());

    var valid: boolean =  tv4.validate(rules.toJSON(), this.rules_schema.toJSON(), true, true);
    if (!valid){
        throw error.validation(
            rules,
            this.rules_schema,
            "blaze file",
            "blaze schema",
            tv4.error)
            .source(rules.lookup(tv4.error.dataPath.split("/")))
            .on(new Error())
    }

    if (tv4.getMissingUris().length != 0){
        throw error.missingURI(tv4.getMissingUris()).on(new Error());
    }

    return valid;
}

export class SchemaRoot{
    json: Json.JValue;
    root: schema.SchemaNode;

    constructor(json: Json.JValue){
        this.json = json;
    }
    static parse(json: Json.JValue): SchemaRoot {
        if (json == null) {
            json = new Json.JObject()
        }
        return new SchemaRoot(json);
    }
}


export class AccessEntry{
    location: string[]; //components of address, e.g. users/$userid is mapped to ['users', '$userid']
    read:     expression.Expression = expression.Expression.FALSE;
    write:    expression.Expression = expression.Expression.FALSE;

    static parse(json: Json.JValue): AccessEntry{
        //console.log("AccessEntry.parse:", json);

        var accessEntry = new AccessEntry();
        accessEntry.location =
            json.getOrThrow("location", "all access entries require a location to be defined")
            .asString().value.split("/");

        //deal with issue of "/*" being split to "['', '*']" by removing first element
        while (accessEntry.location[0] === ''){
            accessEntry.location.shift();
        }

        if (accessEntry.location[accessEntry.location.length-1] == "") {
            accessEntry.location.pop()
        }

        if (json.has("read")){
            accessEntry.read     = expression.Expression.parseUser(json.getOrThrow("read", "").coerceString());
        }
        if (json.has("write")){
            accessEntry.write    = expression.Expression.parseUser(json.getOrThrow("write", "").coerceString());
        }

        //console.log("accessEntry.location", accessEntry.location);
        return accessEntry
    }

    match(location: string[]): boolean{
        //console.log("checking if ", location, " matches ", this.location);
        //candidate location must be at least as specific as this location
        if(this.location.length > location.length) return false;

        for(var idx in this.location){
            if (!this.matchSegment(this.location[idx], location[idx])) return false
        }
        //console.log("access entry is applicable");
        return true;
    }

    // todo hot method
    isChildOf(location: string[]): boolean{
        if (this.location.length <= location.length) return false;
        for(var idx in location){
            if (!this.matchSegment(this.location[idx], location[idx])) return false
        }
        return true;
    }

    matchSegment(rule_segment: string, path_segment): boolean{
        if (rule_segment.indexOf("~$") == 0) rule_segment = rule_segment.substr(1);
        if (path_segment.indexOf("~$") == 0) path_segment = path_segment.substr(1);
        if (rule_segment.indexOf("$") == 0 && path_segment.indexOf("$") == 0) return true;

        return rule_segment == path_segment
    }

    /**
     *localize the read expression for the given path
     */
    getReadFor(symbols: expression.Symbols, path: string[]): expression.Expression {
        var base_read = expression.Expression.parse(this.read.expandFunctions(symbols));
        for (var i = 0; i < path.length - this.location.length; i++) {
            var rewrite = base_read.rewriteForChild();
            base_read = expression.Expression.parse(rewrite)
        }
        return base_read
    }

    /**
     *localize the read expression for the given path
     * we have to expand functions first, so that the insides of functions are also localised
     */
    getWriteFor(symbols: expression.Symbols, path: string[]): expression.Expression {
        var base_write = expression.Expression.parse(this.write.expandFunctions(symbols));
        for (var i = 0; i < path.length - this.location.length; i++) {
            base_write = expression.Expression.parse(base_write.rewriteForChild())
        }
        return base_write
    }
}

export class Access {
    [index: number]: AccessEntry;

    static parse(json: Json.JValue):Access{
        //console.log("Access.parse:", json);
        var access = new Access();
        if (json == null) return access;

        json.asArray().forEachIndexed(function(entry: Json.JValue, id: number){
            var accessEntry = AccessEntry.parse(entry);
            access[id] = (accessEntry);
        });
        return access
    }

    // todo hot method
    static getChildren(self: Access, path: string[]): AccessEntry[] {
        var children: AccessEntry[] = [];
        for (var i = 0; self[i] != undefined; i++) {
            var rule: AccessEntry = self[i];
            if (rule.isChildOf(path)) children.push(rule)
        }
        return children;
    }
}

export class Rules{
    functions: expression.Functions;
    schema:     SchemaRoot;
    access:     Access;

    code: string = null; //generated rules, or null

    static parse(json: Json.JObject):Rules{
        var rules = new Rules();
        rules.functions = expression.Functions.parse(json.getOrNull("functions"));
        rules.schema     = SchemaRoot.parse(json.getOrNull("schema"));
        rules.access     = Access.parse(json.getOrWarn("access", "no access list defined, this Firebase will be inactive"));
        return rules
    }

    /**
     * adds dummy schema
     */
    inflateSchema():void {
        this.inflateSchemaRecursive(this.schema.json.asObject(), [], {})
    }

    inflateSchemaRecursive(json: Json.JObject, path: string[], memoization: {[path: string]: boolean}): void {

        if (memoization[path.join("/")]) return; //we processed this before
        else {
            memoization[path.join("/")] = true; // indicate this has been done
        }
        // console.log("inflateSchemaRecursive", path);
        var children = Access.getChildren(this.access, path);

        children.map(function(child: AccessEntry) {
            var childSegment = child.location[path.length];

            var schemaChild = null;
            if (childSegment.indexOf("~$") == 0 || childSegment.indexOf("$") == 0) {
                //the child is a wildchild
                var wildKey = schema.getWildchild(json);
                if (wildKey == null){
                    schemaChild = new Json.JObject();
                    console.error("WARNING: " + child.location.join("/") + " in access rule but not in a schema");
                    json.put(new Json.JString(childSegment, -1,-1), schemaChild);
                } else {
                    schemaChild = json.getOrThrow(wildKey.getString(), "error");
                }
            } else {
                //the child is a fixed child, should be declared in properties

                //lazy create properties if necessary
                var properties = json.getOrNull("properties");
                if (properties == null) {
                    properties = new Json.JObject();
                    json.put(new Json.JString("properties", -1,-1), properties)
                }

                //lazy add child if necessary
                schemaChild = properties.asObject().getOrNull(childSegment);
                if (schemaChild == null){
                    console.error("WARNING: " + child.location.join("/") + " in access rule but not in a schema");
                    schemaChild = new Json.JObject();
                    properties.asObject().put(new Json.JString(childSegment, -1,-1), schemaChild);
                }
            }

            this.inflateSchemaRecursive(schemaChild, child.location.slice(0, path.length + 1), memoization);
        }, this)

    }
}