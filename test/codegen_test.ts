/// <reference path="../types/nodeunit.d.ts" />
import expressions = require('../src/expression');

import test_utils  = require('./test_utils');
import firebase_io = require('./firebase_io');
import compile = require('../src/compile');
import rules = require('../src/rules');
import async = require('async');

export function testString(test:nodeunit.Test):void{
    async.series([
        firebase_io.setValidationRules.bind(null, compile.compile("test/cases/string.yaml", true)),
        test_utils.assert_can_write.bind (null, "any", "/", "string", test),
        test_utils.assert_cant_write.bind(null, "any", "/", {"child":"string"}, test),
        test_utils.assert_can_read.bind  (null, "any", "/", "string", test)
    ], test.done.bind(null));
}

export function testPredicate_access(test:nodeunit.Test):void{
    async.series([
        firebase_io.setValidationRules.bind(null, compile.compile("test/cases/predicate_access.yaml", true)),
        test_utils.assert_cant_write.bind(null,  "tom", "/", "string", test),
        test_utils.assert_can_write.bind (null,  "not", "/", "string", test),
        test_utils.assert_cant_read.bind (null,  "not", "/", test),
        test_utils.assert_can_read.bind  (null,  "tom", "/", "string", test)
    ], test.done.bind(null));
}

export function testAccess(test:nodeunit.Test):void{
    async.series([
        firebase_io.setValidationRules.bind(null, compile.compile("test/cases/access.yaml", true)),

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

        test_utils.assert_can_write_mock.bind(null, "red",  "/chld1", {}, test),
        test_utils.assert_can_write_mock.bind(null, "black","/chld2", {}, test),
        test_utils.assert_cant_write.bind(null,     "black","/chld1", {}, test),
        test_utils.assert_cant_write.bind(null,      "red", "/chld2", {}, test),

        test_utils.assert_cant_write.bind(null,      "red", "/", {}, test),
        test_utils.assert_cant_write.bind(null,      "red", "/", {}, test)

    ], test.done.bind(null));
}

export function testCascade(test:nodeunit.Test):void{
    async.series([
        firebase_io.setValidationRules.bind(null, compile.compile("test/cases/cascade.yaml", true)),

        test_utils.assert_admin_can_write.bind(null, "/",{}, test),

        test_utils.assert_cant_write.bind(null, "any","/chld1/grnd1", "string", test),
        test_utils.assert_cant_write.bind(null, "any","/chld1/grnd2", "string", test),
        test_utils.assert_cant_write.bind(null, "any","/chld2/grnd3", "string", test),
        test_utils.assert_cant_write.bind(null, "any","/chld2/grnd4", "string", test),

        test_utils.assert_can_write.bind(null, "any","/",
            {chld1:{grnd1:"1", grnd2:"2"}, chld2:{grnd3:"3", grnd4:"4"}}, test)


    ], test.done.bind(null));
}

export function testRequired(test:nodeunit.Test):void{
    async.series([
        firebase_io.setValidationRules.bind(null, compile.compile("test/cases/required.yaml", true)),

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
        test_utils.assert_cant_write.bind(null, "any","/chld1/grnd1", "1", test)


    ], test.done.bind(null));
}

export function testWildchild(test:nodeunit.Test):void{
    async.series([
        firebase_io.setValidationRules.bind(null, compile.compile("test/cases/wildchild.yaml", true)),

        test_utils.assert_admin_can_write.bind(null, "/",{}, test),


        test_utils.assert_can_write_mock.bind(null, "any","/chld1", "Y", test),
        test_utils.assert_can_write_mock.bind(null, "any","/chld2", "Y", test),
        test_utils.assert_cant_write.bind(null,     "any","/chld2", "N", test),
        test_utils.assert_cant_write.bind(null,     "any","/chld2", "N", test),

        test_utils.assert_cant_write.bind(null, "any","/", {chld1:"Y", chld2:"Y"}, test),


        test_utils.assert_can_write.bind(null, "any","/extra", "N", test)


    ], test.done.bind(null));
}

export function testTypes(test:nodeunit.Test):void{
    async.series([
        firebase_io.setValidationRules.bind(null, compile.compile("test/cases/types.yaml", true)),

        test_utils.assert_admin_can_write.bind(null, "/",{}, test),

        test_utils.assert_can_write_mock.bind(null, "any","/object",  {a:5}   , test),
        test_utils.assert_can_write_mock.bind(null, "any","/string",  "string", test),
        test_utils.assert_can_write_mock.bind(null, "any","/number",  1, test),
        test_utils.assert_can_write_mock.bind(null, "any","/boolean", true    , test),

        test_utils.assert_cant_write.bind(null, "any","/object",  "string" , test),
        test_utils.assert_cant_write.bind(null, "any","/string",  1        , test),
        test_utils.assert_cant_write.bind(null, "any","/number",  true     , test),
        test_utils.assert_cant_write.bind(null, "any","/boolean", {a:5}    , test),
        test_utils.assert_cant_write.bind(null, "any","/boolean", "true"   , test),

        test_utils.assert_cant_write.bind(null, "any","/extra", true    , test),

    ], test.done.bind(null));
}

export function testDefinitions(test:nodeunit.Test):void{
    async.series([
        firebase_io.setValidationRules.bind(null, compile.compile("test/cases/definitions.yaml", true)),

        test_utils.assert_admin_can_write.bind(null, "/",{}, test),

        test_utils.assert_can_write.bind(null, "any","/object",  {"boolean":true}   , test),
        test_utils.assert_can_write_mock.bind(null, "any","/object/boolean",  true   , test),
        test_utils.assert_can_write_mock.bind(null, "any","/string",  "string", test),
        test_utils.assert_can_write_mock.bind(null, "any","/number",  1, test),
        test_utils.assert_can_write_mock.bind(null, "any","/boolean", true    , test),

        test_utils.assert_cant_write.bind(null, "any","/object",  "string" , test),
        test_utils.assert_cant_write.bind(null, "any","/string",  1        , test),
        test_utils.assert_cant_write.bind(null, "any","/number",  true     , test),
        test_utils.assert_cant_write.bind(null, "any","/boolean", {a:5}    , test),
        test_utils.assert_cant_write.bind(null, "any","/boolean", "true"   , test),

        test_utils.assert_cant_write.bind(null, "any","/extra", true    , test),

        test_utils.assert_can_write_mock.bind(null, "any","/object/string",  "string", test),
        test_utils.assert_can_write_mock.bind(null, "any","/object/number",  1, test),
        test_utils.assert_can_write_mock.bind(null, "any","/object/boolean", true    , test),


        test_utils.assert_cant_write.bind(null, "any","/object/extra", true    , test),

    ], test.done.bind(null));
}