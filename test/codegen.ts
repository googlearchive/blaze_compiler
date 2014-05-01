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