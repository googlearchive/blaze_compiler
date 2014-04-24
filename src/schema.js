/*
For loading and validating schema in JSON and YAML
*/
/// <reference path="../types/js-yaml.d.ts" />
/// <reference path="../types/node.d.ts" />
/// <reference path="../types/tv4.d.ts" />
/// <reference path="../src/RuleExpression.ts" />
var fs = require("fs");
var js_yaml = require("js-yaml");
var tv4 = require('tv4');
var ruleExpression = require('../src/RuleExpression');

/**
* synchronously loads a file resource, converting from YAML to JSON
* @param filepath location on filesystem
*/
function load_yaml(filepath) {
    var json = fs.readFileSync(filepath, { encoding: 'utf8' }).toString();
    return js_yaml.load(json, 'utf8');
}
exports.load_yaml = load_yaml;

exports.rules_schema = exports.load_yaml("schema/security_rules.yaml");

function validate_rules(rules) {
    tv4.addSchema("http://firebase.com/schema/types/object#", this.load_yaml("schema/types/object.yaml"));
    tv4.addSchema("http://firebase.com/schema#", this.load_yaml("schema/schema.yaml"));

    var result = tv4.validateResult(rules, this.rules_schema);

    if (!result.valid) {
        console.log(result.error);
    }

    if (tv4.getMissingUris().length != 0) {
        console.log(tv4.getMissingUris());
        return false;
    }

    return result.valid;
}
exports.validate_rules = validate_rules;

var Predicate = (function () {
    function Predicate() {
    }
    Predicate.cannocal = function (declaration) {
        return declaration.replace(/\s+/, "");
    };

    Predicate.parse = function (json) {
        console.log("Predicate.parse:", json);
        var predicate = new Predicate();

        for (var key in json) {
            predicate.key = Predicate.cannocal(key);
            predicate.expression = ruleExpression.Expression.parse(json[key]);
        }
        return predicate;
    };
    return Predicate;
})();
exports.Predicate = Predicate;

/**
* instances support indexing like arrays, which maps cannocal predicate declarations to Predicate definitions
*/
var Predicates = (function () {
    function Predicates() {
    }
    Predicates.parse = function (json) {
        console.log("Predicates.parse:", json);
        var predicates = new Predicates();

        for (var predicate_def in json) {
            var predicate = Predicate.parse(json[predicate_def]);
            predicates[predicate.key] = predicate;
        }
        return predicates;
    };
    return Predicates;
})();
exports.Predicates = Predicates;

var Schema = (function () {
    function Schema() {
    }
    Schema.parse = function (json) {
        var schema = new Schema();
        return schema;
    };
    return Schema;
})();
exports.Schema = Schema;

var AccessEntry = (function () {
    function AccessEntry() {
    }
    AccessEntry.parse = function (json) {
        console.log("AccessEntry.parse:", json);

        var accessEntry = new AccessEntry();
        accessEntry.location = json.location;
        accessEntry.read = ruleExpression.Expression.parse(json.read);
        accessEntry.write = ruleExpression.Expression.parse(json.write);
        return accessEntry;
    };
    return AccessEntry;
})();
exports.AccessEntry = AccessEntry;

var Access = (function () {
    function Access() {
    }
    Access.parse = function (json) {
        console.log("Access.parse:", json);
        var access = new Access();

        for (var index in json) {
            var accessEntry = AccessEntry.parse(json[index]);
            access[index] = accessEntry;
        }
        return access;
    };
    return Access;
})();
exports.Access = Access;

var Rules = (function () {
    function Rules() {
    }
    Rules.parse = function (json) {
        var rules = new Rules();
        rules.predicates = Predicates.parse(json.predicates);
        rules.schema = Schema.parse(json.schema);
        rules.access = Access.parse(json.access);
        return rules;
    };
    return Rules;
})();
exports.Rules = Rules;
//# sourceMappingURL=schema.js.map
