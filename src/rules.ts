/*
    For loading and validating schema in JSON and YAML
*/

/// <reference path="../types/js-yaml.d.ts" />
/// <reference path="../types/node.d.ts" />
/// <reference path="../types/tv4.d.ts" />
/// <reference path="../src/expression.ts" />

import fs = require("fs");
import js_yaml = require("js-yaml");
import tv4 = require('tv4');
import expression = require('../src/expression');
import schema = require('../src/schema');

/**
 * synchronously loads a file resource, converting from YAML to JSON
 * @param filepath location on filesystem
 */
export function load_yaml(filepath:string):any{
    var json = fs.readFileSync(filepath, {encoding: 'utf8'}).toString();
    return js_yaml.load(json, 'utf8');
}

export var rules_schema:string = load_yaml("schema/security_rules.yaml");

export function validate_rules(rules:string):boolean{
    tv4.addSchema("http://firebase.com/schema/types/object#", this.load_yaml("schema/types/object.yaml"));
    tv4.addSchema("http://firebase.com/schema#", this.load_yaml("schema/schema.yaml"));

    var result =  tv4.validateResult(rules, this.rules_schema);

    if(!result.valid){
        console.log(result.error)
    }

    if(tv4.getMissingUris().length != 0){
        console.log(tv4.getMissingUris());
        return false;
    }

    return result.valid;
}

export class SchemaRoot{
    json:any;
    root:schema.SchemaNode;

    constructor(json:any){
        this.json = json;
    }
    static parse(json:any):SchemaRoot{
        var schema = new SchemaRoot(json);
        return schema
    }
}


export class AccessEntry{
    location: string;
    read:     expression.Expression;
    write:    expression.Expression;

    static parse(json:any):AccessEntry{
        console.log("AccessEntry.parse:", json);

        var accessEntry = new AccessEntry();
        accessEntry.location = json.location;
        accessEntry.read     = expression.Expression.parse(<string>json.read);
        accessEntry.write    = expression.Expression.parse(<string>json.write);
        return accessEntry
    }
}

export class Access{
    [index: number]: AccessEntry;

    static parse(json:any):Access{

        console.log("Access.parse:", json);
        var access = new Access();

        for(var index in json){
            var accessEntry = AccessEntry.parse(json[index]);
            access[index] = accessEntry;
        }
        return access
    }
}

export class Rules{
    predicates: expression.Predicates;
    schema:     SchemaRoot;
    access:     Access;

    static parse(json:any):Rules{
        var rules = new Rules();
        rules.predicates = expression.Predicates.parse(json.predicates);
        rules.schema     = SchemaRoot.parse(json.schema);
        rules.access     = Access.parse(json.access);
        return rules
    }
}