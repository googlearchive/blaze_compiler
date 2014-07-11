/// <reference path="../../types/node.d.ts" />
/// <reference path="../../types/nodeunit.d.ts" />
/// <reference path="../../src/json/jsonparser.ts" />
import fs = require('fs');
import Json = require('../../src/json/jsonparser');

export function testSetup(test:nodeunit.Test): void {
    var json: Json.JValue = Json.parse(fs.readFileSync("test/json/parser_test.json", {encoding: 'utf8'}).toString());

    console.log(JSON.stringify(json, null, 4));

    test.ok(true);
    test.done();
}
