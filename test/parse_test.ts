/// <reference path="../types/nodeunit.d.ts" />
import rules = require('../src/rules');

export function testEntryParseRoot1(test) {
    var entry: rules.AccessEntry = rules.AccessEntry.parse({
        location: "/"
    });

    test.deepEqual(entry.location, []);

    var entry: rules.AccessEntry = rules.AccessEntry.parse({
        location: ""
    });

    test.deepEqual(entry.location, []);

    test.done();
}