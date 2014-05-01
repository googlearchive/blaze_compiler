/*
For loading and validating schema in JSON and YAML
*/
/// <reference path="../types/js-yaml.d.ts" />
/// <reference path="../types/node.d.ts" />
/// <reference path="../types/tv4.d.ts" />
/// <reference path="../src/expression.ts" />
var fs = require("fs");
var js_yaml = require("js-yaml");
var tv4 = require('tv4');
var expression = require('../src/expression');

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

var SchemaRoot = (function () {
    function SchemaRoot(json) {
        this.json = json;
    }
    SchemaRoot.parse = function (json) {
        var schema = new SchemaRoot(json);
        return schema;
    };
    return SchemaRoot;
})();
exports.SchemaRoot = SchemaRoot;

var AccessEntry = (function () {
    function AccessEntry() {
        this.read = expression.Expression.parse("false");
        this.write = expression.Expression.parse("false");
    }
    AccessEntry.parse = function (json) {
        //console.log("AccessEntry.parse:", json);
        var accessEntry = new AccessEntry();
        accessEntry.location = json.location.split("/");

        if (accessEntry.location[accessEntry.location.length - 1] !== '*') {
            throw new Error("AccessEntry.location must end in /*");
        } else {
            accessEntry.location.pop();
        }

        //deal with issue of "/*" being split to "['', '*']" by removing first element
        if (accessEntry.location.length > 0 && accessEntry.location[0] === '') {
            accessEntry.location.shift();
        }
        if (json.read) {
            accessEntry.read = expression.Expression.parse(json.read);
        }
        if (json.write) {
            accessEntry.write = expression.Expression.parse(json.write);
        }

        return accessEntry;
    };

    AccessEntry.prototype.match = function (location) {
        //candidate location must be at least as specific as this location
        if (this.location.length > location.length)
            return false;

        for (var idx in this.location) {
            if (this.location[idx] !== location[idx])
                return false;
        }
        return true;
    };
    return AccessEntry;
})();
exports.AccessEntry = AccessEntry;

var Access = (function () {
    function Access() {
    }
    Access.parse = function (json) {
        //console.log("Access.parse:", json);
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
        rules.predicates = expression.Predicates.parse(json.predicates);
        rules.schema = SchemaRoot.parse(json.schema);
        rules.access = Access.parse(json.access);
        return rules;
    };
    return Rules;
})();
exports.Rules = Rules;
//# sourceMappingURL=rules.js.map
