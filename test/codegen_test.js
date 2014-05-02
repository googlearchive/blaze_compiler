var test_utils = require('./test_utils.js');
var firebase_io = require('./firebase_io.js');
var compile = require('../src/compile');

var async = require('async');

/*
export function testString(test:nodeunit.Test):void{
async.series([
firebase_io.setValidationRules.bind(null, compile.compile("test/cases/string.yaml")),
test_utils.assert_can_write.bind (null, "any", "/", "string", test),
test_utils.assert_cant_write.bind(null, "any", "/", {"child":"string"}, test),
test_utils.assert_can_read.bind  (null, "any", "/", "string", test)
], test.done.bind(null));
}
export function testPredicate_access(test:nodeunit.Test):void{
async.series([
firebase_io.setValidationRules.bind(null, compile.compile("test/cases/predicate_access.yaml")),
test_utils.assert_cant_write.bind(null,  "tom", "/", "string", test),
test_utils.assert_can_write.bind (null,  "not", "/", "string", test),
test_utils.assert_cant_read.bind (null,  "not", "/", test),
test_utils.assert_can_read.bind  (null,  "tom", "/", "string", test)
], test.done.bind(null));
}
export function testAccess(test:nodeunit.Test):void{
async.series([
firebase_io.setValidationRules.bind(null, compile.compile("test/cases/access.yaml")),
test_utils.assert_admin_can_write.bind(null, "/",
{chld1:{grnd1:"1", grnd2:"2"}, chld2:{grnd3:"3", grnd4:"4"}}, test),
test_utils.assert_cant_write.bind(null, "red",  "/chld2",       {}, test),
test_utils.assert_cant_write.bind(null, "red",  "/chld2",       {}, test),
test_utils.assert_cant_write.bind(null, "black","/",            {}, test),
test_utils.assert_cant_write.bind(null, "black","/chld1/grnd1", "string", test),
test_utils.assert_cant_write.bind(null, "black","/chld1/grnd2", "string", test),
test_utils.assert_can_write_mock.bind(null, "red","/chld1/grnd1",   "string", test),
test_utils.assert_can_write_mock.bind(null, "red","/chld1/grnd2",   "string", test),
test_utils.assert_can_write_mock.bind(null, "black","/chld2/grnd3", "string", test),
test_utils.assert_can_write_mock.bind(null, "black","/chld2/grnd4", "string", test),
test_utils.assert_can_write_mock.bind(null, "red",  "/chld1", "string", test),
test_utils.assert_can_write_mock.bind(null, "black","/chld2", "string", test),
test_utils.assert_cant_write.bind(null,     "black","/chld1", "string", test),
test_utils.assert_cant_write.bind(null,      "red", "/chld2", "string", test),
test_utils.assert_cant_write.bind(null,      "red", "/", {}, test),
test_utils.assert_cant_write.bind(null,      "red", "/", {}, test)
], test.done.bind(null));
}
export function testCascade(test:nodeunit.Test):void{
async.series([
firebase_io.setValidationRules.bind(null, compile.compile("test/cases/cascade.yaml")),
test_utils.assert_admin_can_write.bind(null, "/",{}, test),
test_utils.assert_cant_write.bind(null, "any","/chld1/grnd1", "string", test),
test_utils.assert_cant_write.bind(null, "any","/chld1/grnd2", "string", test),
test_utils.assert_cant_write.bind(null, "any","/chld2/grnd3", "string", test),
test_utils.assert_cant_write.bind(null, "any","/chld2/grnd4", "string", test),
test_utils.assert_can_write.bind(null, "any","/",
{chld1:{grnd1:"1", grnd2:"2"}, chld2:{grnd3:"3", grnd4:"4"}}, test),
], test.done.bind(null));
}
export function testRequired(test:nodeunit.Test):void{
async.series([
firebase_io.setValidationRules.bind(null, compile.compile("test/cases/required.yaml")),
test_utils.assert_admin_can_write.bind(null, "/",{}, test),
//should be able to write full try
test_utils.assert_can_write_mock.bind(null, "any","/",
{chld1:{grnd1:"1", grnd2:"2"}, chld2:{grnd3:"3", grnd4:"4"}},
test),
//or the subtree with both required grandchildren
test_utils.assert_can_write_mock.bind(null, "any","/chld1",
{grnd1:"1", grnd2:"2"},
test),
test_utils.assert_can_write_mock.bind(null, "any","/chld2",
{grnd3:"3", grnd4:"4"},
test),
//or jsut one grandchild of the unrequired tree
test_utils.assert_can_write_mock.bind(null, "any","/chld2/grnd3", "3", test),
//but not one grandchild of the required subtree
test_utils.assert_cant_write.bind(null, "any","/chld1/grnd1", "1", test),
], test.done.bind(null));
}*/
function testWildchild(test) {
    async.series([
        firebase_io.setValidationRules.bind(null, compile.compile("test/cases/wildchild.yaml")),
        test_utils.assert_admin_can_write.bind(null, "/", {}, test),
        test_utils.assert_can_write_mock.bind(null, "any", "/chld1", "Y", test),
        test_utils.assert_can_write_mock.bind(null, "any", "/chld2", "Y", test),
        test_utils.assert_cant_write.bind(null, "any", "/chld2", "N", test),
        test_utils.assert_cant_write.bind(null, "any", "/chld2", "N", test),
        test_utils.assert_cant_write.bind(null, "any", "/", { chld1: "Y", chld2: "Y" }, test),
        test_utils.assert_can_write.bind(null, "any", "/extra", "N", test)
    ], test.done.bind(null));
}
exports.testWildchild = testWildchild;
//# sourceMappingURL=codegen_test.js.map
