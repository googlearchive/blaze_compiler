import schema = require('../src/schema');
import rules = require('../src/rules');
import expression = require('../src/expression');
import fs = require('fs');


export function compileJSON(json:any, debug:boolean):string{
    //check user's JSON meets JSON schema spec of rule file
    var ok = rules.validate_rules(json);
    if(ok){
        //convert users rule file into a model
        var model:rules.Rules = rules.Rules.parse(json);

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
        var code:string = schema.generateRules(model);

        //print generate code out
        if(debug){
            console.log("\ngenerated code:");
            console.log(code);
        }
        //write to file
        console.log("\nwriting rules.json");
        fs.writeFileSync("rules.json", code);
        return code;
    }else{
        throw Error("did not globally validate");
    }
}

export function compile(path:string, debug:boolean):string{
    //convert to JSON
    var json:string = rules.load_yaml(path);
    return compileJSON(json, debug);

}