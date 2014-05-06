/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />


/// <reference path="../types/js-yaml.d.ts" />

import fs = require("fs");
import expression = require('../src/expression');
import rules      = require('../src/rules');
import compile    = require('../src/compile');
import js_yaml = require("js-yaml");
import tv4 = require("tv4");


export function testValidSchema(test){
    var firebase_schema     = rules.load_yaml("schema/schema.yaml");
    var metaschema = fs.readFileSync("schema/jsonschema", {encoding: 'utf8'});

    var valid = tv4.validate(firebase_schema, metaschema, false, false);

    test.deepEqual(tv4.getMissingUris(), []);

    test.ok(valid);
    test.done();
}

export function testStructureValidation(test){
    var structure_example = rules.load_yaml("examples/structure.yaml");
    test.ok(rules.validate_rules(structure_example));
    test.done();
}


export function testStructureParsing(test){
    var structure_example = rules.load_yaml("examples/structure.yaml");
    var rule = rules.Rules.parse(structure_example);
    console.log(rule);
    test.ok(rule.schema != null);
    test.ok(rule.predicates["isLoggedIn"] != null);
    test.done();
}

export function testAntiCases(test){

    //load all anti-cases
    var files = fs.readdirSync("test/anticases");

    for(var i in files){
        if (!files.hasOwnProperty(i)) continue;
        var path:string = "test/anticases/"+files[i];

        rules.load_yaml_collection(path, function(anticase:any){


            try{
                compile.compileJSON(anticase, false);
                test.ok(false, "should not have passed validation: " + JSON.stringify(anticase))
            }catch(err){
                test.ok(true)
            }

        });
    }

    test.done();
}

export function testMailValidation(test){
    var mail_example = rules.load_yaml("examples/mail_example.yaml");
    test.ok(rules.validate_rules(mail_example));
    test.done();
}

export function testRequiredArray(test){
    var schema_yaml =
        "schema:\n"+
        "  type: object\n"+
        "  required: object\n"; //should fail because required is not an array


    var schema = js_yaml.load(schema_yaml, 'utf8');

    test.ok(!rules.validate_rules(schema)); //should not pass global validation

    try{
        compile.compileJSON(schema, false);
        test.ok(false)
    }catch(err){
        test.ok(true)
    }

    test.done();
}