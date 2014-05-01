var schema = require('../src/schema');
var rules = require('../src/rules');

var fs = require('fs');

function compile(path) {
    //convert to JSON
    var json = rules.load_yaml(path);

    //check user's JSON meets JSON schema spec of rule file
    var ok = rules.validate_rules(json);

    if (ok) {
        //convert users rule file into a model
        var model = rules.Rules.parse(json);

        //first pass of compiler,
        //metaschema generate constraints for schema
        schema.annotate(model);

        console.log("\nannotated model:");
        console.log(model.schema.root);

        //second pass of compiler
        //constraints pushed into leaves
        schema.flattenConstraints(model);
        console.log("\nflattened model:");
        console.log(model.schema.root);

        //3rd pass pass of compiler, unifying ACL and the schema
        schema.combineACL(model);
        console.log("\n ACL and schema:");
        console.log(model.schema.root);

        //generate output in security rules 1.0 syntax into a buffer
        var code = schema.generateRules(model);

        //print generate code out
        console.log("\ngenerated code:");
        console.log(code);

        //write to file
        fs.writeFileSync("rules.json", code);
        return code;
    } else {
        return null;
    }
}
exports.compile = compile;
//# sourceMappingURL=compile.js.map
