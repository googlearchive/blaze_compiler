/// <reference path="../../types/node.d.ts" />
/// <reference path="../../types/nodeunit.d.ts" />
import fs = require('fs');
import Json = require('../../src/processors/Json');

export function testParse(test:nodeunit.Test): void {
    var json: Json.JValue = Json.parse(fs.readFileSync("test/json/parser_test.json", {encoding: 'utf8'}).toString());

    //console.log(JSON.stringify(json, null, 4));

    test.equal(json.start.row, 1);
    test.equal(json.start.col, 1);
    test.equal(json.end.row, 7);
    test.equal(json.end.col, 2);

    test.ok(true);
    test.done();
}


export function compareJSYamlWithCustomJSYaml(test:nodeunit.Test): void {
    //reading the data using our custom js-yaml parser
    var jsyaml: Json.JValue = Json.parse_yaml(fs.readFileSync("test/json/complicated.yaml", {encoding: 'utf8'}).toString());
    //reading the data using our custom greatjson parser (after using OTS js-yaml at the command line)
    var greatjson: Json.JValue = Json.parse(fs.readFileSync("test/json/complicated.json", {encoding: 'utf8'}).toString());

    //the two should produce the same data!
    //console.log(greatjson.toJSON());
    test.deepEqual(greatjson.toJSON(), jsyaml.toJSON());
    test.done();
}


//compareJSYamlWithCustomJSYaml(null);