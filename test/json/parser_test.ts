/// <reference path="../../types/node.d.ts" />
/// <reference path="../../types/nodeunit.d.ts" />
import fs = require('fs');
import Json = require('../../src/processors/Json');

export function testParseJson(test:nodeunit.Test): void {
    var json: Json.JValue = Json.parse(fs.readFileSync("test/json/parser_test.json", {encoding: 'utf8'}).toString());

    //console.log(JSON.stringify(json, null, 4));

    test.equal(json.start.row, 1);
    test.equal(json.start.col, 1);
    test.equal(json.end.row, 7);
    test.equal(json.end.col, 2);

    test.ok(true);
    test.done();
}

export function testParseYaml(test:nodeunit.Test): void {
    var json: Json.JValue = Json.parse_yaml(fs.readFileSync("test/json/complicated.yaml", {encoding: 'utf8'}).toString());

    //console.log(JSON.stringify(json, null, 4));

    test.equal(json.start.row, 1);
    test.equal(json.start.col, 1);

    //its a little inconsistent where exactly it notes the beginning, but its essentially right
    var patternProperties = json.getOrThrow("patternProperties", "");
    test.equal(patternProperties.start.row, 151); //the object after the key position
    test.equal(patternProperties.start.col, 19);

    var wildchild = patternProperties.getOrThrow("\\$.+", "");
    test.equal(wildchild.start.row, 153);
    test.equal(wildchild.start.col, 5);

    var object = json.lookup(["patternProperties", "\\$.+"]).toJSON();
    test.deepEqual(object, { '$ref': 'http://firebase.com/schema#' });

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