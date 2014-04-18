#! /usr/bin/env node
var js_yaml = require("js-yaml");
var fs  = require("fs");
var tv4 = require("tv4");



var json = js_yaml.load(fs.readFileSync("example.yaml").toString());

var schema = json.schema;

//console.log("schema:");
//console.log(schema);

var banUnknownProperties = false;
var checkRecursive = true;
var meta_schema = JSON.parse(fs.readFileSync("core_meta_schema.json").toString());
tv4.addSchema("http://json-schema.org/draft-04/schema", meta_schema);
var valid = tv4.validate(schema, meta_schema, checkRecursive, banUnknownProperties);

console.log("isValid?", valid);
if(!valid){
    console.log(tv4.error)
}
console.log("tv4.missing?", tv4.missing);
console.log("tv4.getMissingUris?", tv4.getMissingUris());
