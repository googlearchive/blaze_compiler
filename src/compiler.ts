/// <reference path="../node_modules/source-processor/index.d.ts" />
require('source-map-support').install();
import schema = require('../src/schema');
import blaze = require('./blaze');
import Json  = require('source-processor');
import expression = require('../src/expression');
import fs = require('fs');

var debug_intermediates = true;
/**
 * compiles a json object into an annotated model of rules, then writes it to file in rules.json
 * return null if failed, or the model
 */
export function compileJSON(json: Json.JValue, debug: boolean): blaze.Rules {
    //check user's JSON meets JSON schema spec of rule file
    schema.debug = debug;
    try {
        var ok = blaze.validate_rules(json);
        if (debug_intermediates){
            console.log("\ninput:");
            console.log(JSON.stringify(json.toJSON()));
        }

        //convert users rule file into a model
        var model: blaze.Rules = blaze.Rules.parse(json.asObject());

        //1st pass of compiler,
        //metaschema generate constraints for schema
        schema.annotate(model);

        if(debug_intermediates){
            console.log("\nannotated model:");
            console.log(model.schema.root);
        }

        //2nd pass of compiler
        //constraints pushed into leaves
        schema.pushDownConstraints(model);
        if(debug_intermediates){
            console.log("\npushed down constraint model:");
            console.log(model.schema.root);
        }

        //3rd pass of compiler
        //constraints pushed into leaves
        schema.pullUpConstraints(model);
        if (debug_intermediates){
            console.log("\npulled up constraint model:");
            console.log(model.schema.root);
        }

        //4th pass pass of compiler, unifying ACL and the schema
        schema.combineACL(model);
        if (debug_intermediates){
            console.log("\n ACL and schema:");
            console.log(model.schema.root);
        }
        //generate output in security rules 1.0
        var code: string = schema.generateRules(model);

        //print generate code out
        if (debug_intermediates){
            console.log("\ngenerated code:");
            console.log(code);
        }
        //write to file
        console.log("\nwriting rules.json");
        fs.writeFileSync("rules.json", code);
        model.code = code;
        return model;

    } catch (error){
        var source: Json.JValue = <Json.JValue>error.source;
        var msg: string = error.message;

        if (source) {
            console.error("error line " + source.start.row() + ":" + source.start.col());
            console.error(source.toJSON());
        }

        if (debug) console.error(error.stack); //includes writing message
        else{
            console.error(msg);
            console.error("run with -v option for fuller error messages")
        }

        return null;
    }
}

export function compile(path: string, debug: boolean): blaze.Rules{
    blaze.debug = debug;

    //convert to JSON
    if (path.slice(path.length-5) == ".json"){
        var json: Json.JValue = blaze.load_json(path);
    } else {
        var json: Json.JValue = blaze.load_yaml(path);
    }
    return compileJSON(json, debug);

}