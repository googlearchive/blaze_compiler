/*
For loading and validating schema in JSON and YAML
*/
/// <reference path="../types/js-yaml.d.ts" />
/// <reference path="../types/node.d.ts" />
/// <reference path="../types/tv4.d.ts" />
var fs = require("fs");
var js_yaml = require("js-yaml");
var tv4 = require('tv4');

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
//# sourceMappingURL=schema.js.map
