require('source-map-support').install();
import schema = require('../src/schema');
import blaze = require('./blaze');
import Json  = require('./json/jsonparser');
import expression = require('../src/expression');
import fs = require('fs');

export function compileJSON(json:any, debug: boolean): blaze.Rules {
    //check user's JSON meets JSON schema spec of rule file

    try {
        var ok = blaze.validate_rules(json);
        if(debug){
            console.log("\ninput:");
            //console.log(JSON.stringify(json.toJSON()));
        }

        //convert users rule file into a model
        var model: blaze.Rules = blaze.Rules.parse(json);

        //1st pass of compiler,
        //metaschema generate constraints for schema
        schema.annotate(model);

        if(debug){
            console.log("\nannotated model:");
            console.log(model.schema.root);
        }

        //2nd pass of compiler
        //constraints pushed into leaves
        schema.pushDownConstraints(model);
        if(debug){
            console.log("\npushed down constraint model:");
            console.log(model.schema.root);
        }

        //3rd pass of compiler
        //constraints pushed into leaves
        schema.pullUpConstraints(model);
        if(debug){
            console.log("\npulled up constraint model:");
            console.log(model.schema.root);
        }

        //4th pass pass of compiler, unifying ACL and the schema
        schema.combineACL(model);
        if(debug){
            console.log("\n ACL and schema:");
            console.log(model.schema.root);
        }
        //generate output in security rules 1.0
        var code: string = schema.generateRules(model);

        //print generate code out
        if(debug){
            console.log("\ngenerated code:");
            console.log(code);
        }
        //write to file
        console.log("\nwriting rules.json");
        fs.writeFileSync("rules.json", code);
        model.code = code;
        return model;

    } catch (error){
        console.error(error.value);
        console.error(error.msg);

        if (debug) console.error(error.stack);
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