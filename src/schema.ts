/*
    For loading and validating schema in JSON and YAML
*/

/// <reference path="../types/js-yaml.d.ts" />
/// <reference path="../types/node.d.ts" />
/// <reference path="../types/tv4.d.ts" />
/// <reference path="../src/RuleExpression.ts" />

import fs = require("fs");
import js_yaml = require("js-yaml");
import tv4 = require('tv4');
import ruleExpression = require('../src/RuleExpression');

/**
 * synchronously loads a file resource, converting from YAML to JSON
 * @param filepath location on filesystem
 */
export function load_yaml(filepath:string):string{
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

export class Predicate{
    key:         string;
    expression:  ruleExpression.Expression;

    static cannocal(declaration:string):string {
        return declaration.replace(/\s+/, "");
    }

    static parse(json:any):Predicate{
        console.log("Predicate.parse:", json);
        var predicate = new Predicate();

        for(var key in json){
            predicate.key = Predicate.cannocal(key);
            predicate.expression = ruleExpression.Expression.parse(<string>json[key]);
        }
        return predicate
    }
}

/**
 * instances support indexing like arrays, which maps cannocal predicate declarations to Predicate definitions
 */
export class Predicates{
    [index: string]: Predicate;

    static parse(json:any):Predicates{
        console.log("Predicates.parse:", json);
        var predicates = new Predicates();

        for(var predicate_def in json){
            var predicate = Predicate.parse(json[predicate_def]);
            predicates[predicate.key] = predicate;
        }
        return predicates
    }
}

export class Schema{

    static parse(json:any):Schema{
        var schema = new Schema();
        return schema
    }
}


export class AccessEntry{
    location: string;
    read:     ruleExpression.Expression;
    write:    ruleExpression.Expression;

    static parse(json:any):AccessEntry{
        console.log("AccessEntry.parse:", json);

        var accessEntry = new AccessEntry();
        accessEntry.location = json.location;
        accessEntry.read     = ruleExpression.Expression.parse(<string>json.read);
        accessEntry.write    = ruleExpression.Expression.parse(<string>json.write);
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
    predicates: Predicates;
    schema:     Schema;
    access:     Access;

    static parse(json:any):Rules{
        var rules = new Rules();
        rules.predicates = Predicates.parse(json.predicates);
        rules.schema     = Schema.parse(json.schema);
        rules.access     = Access.parse(json.access);
        return rules
    }
}