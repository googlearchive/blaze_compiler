var schema = require('../src/schema');
var rules = require('../src/rules');

var fs = require('fs');

function compile(path) {
    var json = rules.load_yaml(path);

    var ok = rules.validate_rules(json);
    if (ok) {
        var model = rules.Rules.parse(json);

        schema.annotate(model);

        console.log("\nannotated model:");
        console.log(model.schema.root);

        schema.pushDownConstraints(model);
        console.log("\npushed down constraint model:");
        console.log(model.schema.root);

        schema.pullUpConstraints(model);
        console.log("\npulled up constraint model:");
        console.log(model.schema.root);

        schema.combineACL(model);
        console.log("\n ACL and schema:");
        console.log(model.schema.root);

        var code = schema.generateRules(model);

        console.log("\ngenerated code:");
        console.log(code);

        fs.writeFileSync("rules.json", code);
        return code;
    } else {
        return null;
    }
}
exports.compile = compile;
//# sourceMappingURL=compile.js.map
