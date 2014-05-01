/// <reference path="../types/nodeunit.d.ts" />
import expressions = require('../src/expression');

import test_utils  = require('./test_utils.js');
import firebase_io = require('./firebase_io.js');
import compile = require('../src/compile');
import rules = require('../src/rules');
import async = require('async');


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

        test_utils.assert_cant_write.bind(null, "red",  "/chld2",       "string", test),
        test_utils.assert_cant_write.bind(null, "red",  "/chld2",       "string", test),
        test_utils.assert_cant_write.bind(null, "black","/",            "string", test),
        test_utils.assert_cant_write.bind(null, "black","/chld1/grnd1", "string", test),
        test_utils.assert_cant_write.bind(null, "black","/chld1/grnd2", "string", test),

        test_utils.assert_can_write_mock.bind(null, "red","/chld1/grnd1", "string", test),
        test_utils.assert_can_write_mock.bind(null, "red","/chld1/grnd2", "string", test),
        test_utils.assert_can_write_mock.bind(null, "black","/chld2/grnd3", "string", test),
        test_utils.assert_can_write_mock.bind(null, "black","/chld2/grnd4", "string", test),

        test_utils.assert_can_write_mock.bind(null, "red",  "/chld1", "string", test),
        test_utils.assert_can_write_mock.bind(null, "black","/chld2", "string", test),
        test_utils.assert_cant_write.bind(null,     "black","/chld1", "string", test),
        test_utils.assert_cant_write.bind(null,      "red", "/chld2", "string", test),

    ], test.done.bind(null));
}