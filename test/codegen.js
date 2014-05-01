var test_utils = require('./test_utils.js');
var firebase_io = require('./firebase_io.js');
var compile = require('../src/compile');

var async = require('async');

function testString(test) {
    async.series([
        firebase_io.setValidationRules.bind(null, compile.compile("test/cases/string.yaml")),
        test_utils.assert_can_write.bind(null, "any", "/", "string", test),
        test_utils.assert_cant_write.bind(null, "any", "/", { "child": "string" }, test),
        test_utils.assert_can_read.bind(null, "any", "/", "string", test)
    ], test.done.bind(null));
}
exports.testString = testString;
//# sourceMappingURL=codegen.js.map
