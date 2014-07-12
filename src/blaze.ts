/// <reference path="../types/js-yaml.d.ts" />
/// <reference path="../types/node.d.ts" />
/// <reference path="../types/tv4.d.ts" />
/// <reference path="../src/expression.ts" />
require('source-map-support').install();

import fs = require("fs");
import js_yaml = require("js-yaml");
import tv4 = require('tv4');
import expression = require('../src/expression');
import schema = require('../src/schema');
import path = require('path');
import Json = require('./json/jsonparser');
import error = require('./error');

export var debug = false;
/**
 * synchronously loads a file resource, converting from YAML to JSON
 * @param filepath location on filesystem
 */
export function load_yaml(filepath: string): Json.JValue{
    var yaml = fs.readFileSync(filepath, {encoding: 'utf8'}).toString();
    var json_text = JSON.stringify(js_yaml.load(yaml, 'utf8'));
    return Json.parse(json_text);
}

export function load_json(filepath: string): Json.JValue{
    var json = fs.readFileSync(filepath, {encoding: 'utf8'}).toString();
    return Json.parse(json);
}

/**
 * synchronously loads a file resource, converting from multi document YAML to a callback with a JSON param
 */
export function load_yaml_collection(filepath:string, cb:(doc: any) => any):void{
    var json = fs.readFileSync(filepath, {encoding: 'utf8'}).toString();
    js_yaml.loadAll(json, cb,'utf8');
}

export var root:string = path.dirname(fs.realpathSync(__filename)) + "/../";
export var rules_schema: Json.JValue = load_yaml(root + "schema/security_rules.yaml");

export function validate_rules(rules: Json.JValue): boolean{
    tv4.addSchema("http://firebase.com/schema/types/object#", this.load_yaml(root + "schema/types/object.yaml").toJSON);
    tv4.addSchema("http://firebase.com/schema/types/string#", this.load_yaml(root + "schema/types/string.yaml").toJSON);
    tv4.addSchema("http://firebase.com/schema/types/boolean#",this.load_yaml(root + "schema/types/boolean.yaml").toJSON);
    tv4.addSchema("http://firebase.com/schema/types/number#", this.load_yaml(root + "schema/types/number.yaml").toJSON);
    tv4.addSchema("http://firebase.com/schema/types/any#",    this.load_yaml(root + "schema/types/any.yaml").toJSON);

    tv4.addSchema("http://firebase.com/schema#", this.load_yaml(root + "schema/schema.yaml").toJSON);
    tv4.addSchema("http://json-schema.org/draft-04/schema#", fs.readFileSync(root + "schema/jsonschema", {encoding: 'utf8'}).toString());

    var valid: boolean =  tv4.validate(rules.toJSON(), this.rules_schema.toJSON(), true, true);

    if (!valid){
        throw error.validation(
            rules,
            this.rules_schema,
            "rules",
            "rule schema",
            tv4.error).on(new Error())
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
    static parse(json: Json.JValue): SchemaRoot{
        var schema = new SchemaRoot(json);
        return schema
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

    match(location:string[]):boolean{
        //console.log("checking if ", location, " matches ", this.location);
        //candidate location must be at least as specific as this location
        if(this.location.length > location.length) return false;

        for(var idx in this.location){
            if(this.location[idx] !== location[idx]) return false
        }
        //console.log("access entry is applicable");
        return true;
    }
}

export class Access {
    [index: number]: AccessEntry;

    static parse(json: Json.JValue):Access{
        //console.log("Access.parse:", json);
        var access = new Access();

        json.asArray().forEachIndexed(function(entry: Json.JValue, id: number){
            var accessEntry = AccessEntry.parse(entry);
            access[id] = (accessEntry);
        });
        return access
    }
}

export class Rules{
    predicates: expression.Predicates;
    schema:     SchemaRoot;
    access:     Access;

    code: string = null; //generated rules, or null

    static parse(json: Json.JObject):Rules{
        var rules = new Rules();
        rules.predicates = expression.Predicates.parse(json.getOrNull("predicates"));
        rules.schema     = SchemaRoot.parse(json.getOrThrow("schema", "no schema defined"));
        rules.access     = Access.parse(json.getOrThrow("access", "no access list defined"));
        return rules
    }
}