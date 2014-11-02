/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />
/// <reference path="../types/js-yaml.d.ts" />

import fs = require("fs");
import expression = require('../src/expression');
import blaze      = require('../src/blaze');
import compiler   = require('../src/compiler');
import Json       = require('source-processor');
import tv4 = require("tv4");


export function testValidSchema(test: nodeunit.Test){
    var firebase_schema     = blaze.load_yaml("schema/schema.yaml");
    var metaschema = fs.readFileSync("schema/jsonschema", {encoding: 'utf8'});

    var valid = tv4.validate(firebase_schema, metaschema, false, false);

    test.deepEqual(tv4.getMissingUris(), []);

    test.ok(valid);
    test.done();
}

export function testStructureValidation(test: nodeunit.Test){
    var structure_example = blaze.load_yaml("examples/structure.yaml");
    test.ok(blaze.validate_rules(structure_example));
    test.done();
}


export function testStructureParsing(test: nodeunit.Test){
    var structure_example: Json.JValue = blaze.load_yaml("examples/structure.yaml");
    var rule = blaze.Rules.parse(structure_example.asObject());
    console.log(rule);
    test.ok(rule.schema != null);
    test.ok(rule.functions["isLoggedIn"] != null);
    test.done();
}

export function testAntiCases(test: nodeunit.Test){

    //load all anti-cases
    var files = fs.readdirSync("test/anticases"); //it doesn't like directories

    for (var i in files){
        if (!files.hasOwnProperty(i)) continue;
        var path:string = "test/anticases/"+files[i];

        blaze.load_yaml_collection(path, function(anticase: Json.JValue){
            var failed = compiler.compileJSON(anticase) == null;
            if (!failed){
                console.error("passed anticase:-");
                console.error(anticase.toJSON());
            }

            test.ok(failed);
            //I would like to halt the test but an error can't be thrown and
            //you don't want the async done to be called twice

        });
    }

    test.done();
}

export function testMailValidation(test: nodeunit.Test){
    var mail_example = blaze.load_yaml("examples/mail_example.yaml");
    test.ok(blaze.validate_rules(mail_example));
    test.done();
}

export function testRequiredArray(test: nodeunit.Test){
    var schema_yaml =
        "schema:\n"+
        "  type: object\n"+
        "  required: object\n"; //should fail because required is not an array


    var schema: Json.JValue = Json.parse_yaml(schema_yaml);

    try {
        blaze.validate_rules(schema);
        test.ok(false);
    } catch(err) {
        test.ok(true);
    }

    test.ok(compiler.compileJSON(schema) == null);
    test.done();
}