/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />

import fs = require("fs");
import expression = require('../src/expression');
import rules      = require('../src/rules');
import compile    = require('../src/compile');
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