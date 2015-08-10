/// <reference path="../types/nodeunit.d.ts" />
import expressions = require('../src/expression');

import test_utils  = require('./test_utils');
import firebase_io = require('./firebase_io');
import compiler = require('../src/compiler');
import async = require('async');


export function testString(test:nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/string.yaml", true).code, test),
        test_utils.assert_can_write.bind (null, "any", "/", "correct", test),
        test_utils.assert_cant_write.bind(null, "any", "/", "incorrect", test), //not in enum
        test_utils.assert_cant_write.bind(null, "any", "/", {"child":"correct"}, test),
        test_utils.assert_can_read.bind  (null, "any", "/", "correct", test)
    ], test.done.bind(null));
}

export function testNumber(test:nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/number.yaml", true).code, test),

        test_utils.assert_can_write.bind (null, "any", "/plain_number", 4, test),
        test_utils.assert_can_write.bind (null, "any", "/plain_number", 4.2, test),
        test_utils.assert_can_write.bind (null, "any", "/plain_number", -5, test),
        test_utils.assert_cant_write.bind (null, "any", "/plain_number", "str", test),
        test_utils.assert_cant_write.bind (null, "any", "/plain_number", {"a":5}, test),

        test_utils.assert_can_write.bind (null, "any",  "/min_number", 5, test),
        test_utils.assert_cant_write.bind (null, "any", "/min_number", 4.9, test),

        test_utils.assert_can_write.bind (null, "any",  "/exclusive_min_number", 5.1, test),
        test_utils.assert_cant_write.bind (null, "any", "/exclusive_min_number", 5, test),


        test_utils.assert_can_write.bind (null, "any",  "/max_number", 0, test),
        test_utils.assert_cant_write.bind (null, "any", "/max_number", 0.1, test),

        test_utils.assert_can_write.bind (null, "any",  "/exclusive_max_number", -.1, test),
        test_utils.assert_cant_write.bind (null, "any", "/exclusive_max_number", 0, test),


    ], test.done.bind(null));
}

export function testFunction_access(test:nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/function_access.yaml", true).code, test),
        test_utils.assert_cant_write.bind(null,  "tom", "/", "string", test),
        test_utils.assert_can_write.bind (null,  "not", "/", "string", test),
        test_utils.assert_cant_read.bind (null,  "not", "/", test),
        test_utils.assert_can_read.bind  (null,  "tom", "/", "string", test)
    ], test.done.bind(null));
}

export function testAccess(test:nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/access.yaml", true).code, test),

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
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/cascade.yaml", true).code, test),

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
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/required.yaml", true).code, test),

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

export function testTypes(test:nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/types.yaml", true).code, test),

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

export function testDefinitions(test:nodeunit.Test): void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/definitions.yaml", true).code, test),

        test_utils.assert_admin_can_write.bind(null, "/", {}, test),

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


export function testAny(test: nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/any.yaml", true).code, test),

        test_utils.assert_admin_can_write.bind(null, "/",{}, test),

        test_utils.assert_can_write_mock.bind(null, "any","/",  true   , test),
        test_utils.assert_can_write_mock.bind(null, "any","/",  "string"   , test),
        test_utils.assert_can_write_mock.bind(null, "any","/",  {chld_str: "a", chld_bool: true}, test),

        test_utils.assert_cant_write.bind(null, "any","/", {chld_str: false, chld_bool: true}    , test),

    ], test.done.bind(null));
}
export function testWildchild(test:nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/wildchild.yaml", true).code, test),

        test_utils.assert_admin_can_write.bind(null, "/wildchild/",{}, test),


        test_utils.assert_can_write_mock.bind(null, "any","/wildchild/chld1", "Y", test),
        test_utils.assert_can_write_mock.bind(null, "any","/wildchild/chld2", "Y", test),
        test_utils.assert_cant_write.bind(null,     "any","/wildchild/chld1", "N", test),
        test_utils.assert_cant_write.bind(null,     "any","/wildchild/chld2", "N", test),

        test_utils.assert_cant_write.bind(null, "any","/wildchild/", {chld1:"Y", chld2:"Y"}, test),


        test_utils.assert_can_write.bind(null, "any","/wildchild/extra", "N", test),


        test_utils.assert_can_write.bind(null, "any", "/wildchild/real", "Y", test),
        test_utils.assert_cant_write.bind(null, "any", "/wildchild/real", null, test),


    ], test.done.bind(null));
}

export function testWilderchild(test:nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/wildchild.yaml", true).code, test),

        test_utils.assert_admin_can_write.bind(null, "/wilderchild/",{}, test),


        test_utils.assert_can_write_mock.bind(null, "any","/wilderchild/chld1", "Y", test),
        test_utils.assert_can_write_mock.bind(null, "any","/wilderchild/chld2", "Y", test),
        test_utils.assert_cant_write.bind(null,     "any","/wilderchild/chld1", "N", test),
        test_utils.assert_cant_write.bind(null,     "any","/wilderchild/chld2", "N", test),

        test_utils.assert_can_write.bind (null, "any","/wilderchild/", {chld1:"Y", chld2:"Y"}, test),
        test_utils.assert_cant_write.bind(null, "any","/wilderchild/", {chld1:"N", chld2:"Y"}, test),

        test_utils.assert_can_write.bind(null, "any","/wilderchild/extra", "N", test),

        test_utils.assert_can_write.bind(null, "any", "/wilderchild/real", "Y", test),
        test_utils.assert_can_write.bind(null, "any", "/wilderchild/real", null, test), //danger introduced by wilder childs

    ], test.done.bind(null));
}


export function testSanitize(test:nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/sanitize.yaml", true).code, test)
    ], test.done.bind(null));
}


export function testNestedWildchilds(test:nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/wildchild.yaml", true).code, test),

        test_utils.assert_admin_can_write.bind(null, "/nested/",{}, test),


        //anyone can write to grandchildren
        test_utils.assert_can_write.bind(null, null,"/nested/a/a/data", "a", test),
        //no-one can delete because of constraint
        test_utils.assert_cant_write.bind(null, null,"/nested/a/a/data", null, test),

        //authenticated have greater permissions (can't do at the moment)
        //test_utils.assert_can_write.bind(null, "auth", "/nested/a", null, test),
    ], test.done.bind(null));
}

/*TODO
export function testWilderChildMixedAccess(test:nodeunit.Test):void{
    async.series([
        firebase_io.assertSetValidationRules.bind(null, compiler.compile("test/cases/wilderchildHierarchicalAccess.yaml", true).code, test),

        test_utils.assert_admin_can_write.bind(null, "/",{}, test),

        //root can write anywhere
        test_utils.assert_can_write.bind(null, "root","/",       "payload", test),
        test_utils.assert_can_write.bind(null, "root","/a",     "payload", test),
        test_utils.assert_can_write.bind(null, "root","/a/a",   "payload", test),

        //child can write first two level
        test_utils.assert_cant_write.bind(null, "child","/",       "payload", test),
        test_utils.assert_can_write.bind(null, "child","/a",     "payload", test),
        test_utils.assert_can_write.bind(null,  "child","/a/a",   "payload", test),

        //grandchild can write only last level
        test_utils.assert_cant_write.bind(null, "grandchild","/",      "payload", test),
        test_utils.assert_cant_write.bind(null, "grandchild","/a",     "payload", test),
        test_utils.assert_can_write.bind(null, "grandchild","/a/a",   "payload", test),
    ], test.done.bind(null));
}*/
