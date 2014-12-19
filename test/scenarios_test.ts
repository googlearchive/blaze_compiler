/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />
/// <reference path="../types/js-yaml.d.ts" />

import fs = require("fs");
import expression = require('../src/expression');
import blaze      = require('../src/blaze');
import compiler   = require('../src/compiler');
import Json       = require('source-processor');
import globals    = require('../src/globals');
import tv4 = require("tv4");

function run() {
    //called if this file is run, used to enable runtime debugging
    console.log("working?", checkScenario("./test/scenarios/function2.yaml"))
}

var checkScenario = function(path: string): boolean {
    globals.debug = true;
    var scenario: Json.JValue = blaze.load_yaml(path);
    var source   = scenario.getOrThrow("source", "scenario has no 'source' attached " + path);
    var expected = scenario.getOrThrow("expected", "scenario has no 'expected' outcome " + path);
    var result = compiler.compileJSON(source);
    var expectedNormalised = JSON.stringify((expected.toJSON()));
    var resultNormalised = JSON.stringify(JSON.parse(result.code));
    console.log("expectedNormalised", expectedNormalised);
    console.log("resultNormalised  ", resultNormalised);
    return  expectedNormalised == resultNormalised;
};

export function testFiles(test: nodeunit.Test) {

    //load all anti-cases
    var files = fs.readdirSync("test/scenarios");

    for (var i in files){
        if (!files.hasOwnProperty(i)) continue;
        var path:string = "test/scenarios/"+files[i];

        test.ok(checkScenario(path), "error on file " + path);
    }

    test.done();
}

run();