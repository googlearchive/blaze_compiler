/// <reference path="../types/nodeunit.d.ts" />
import blaze = require('../src/blaze');

export function testEntryParseRoot1(test) {
    var entry: blaze.AccessEntry = blaze.AccessEntry.parse({
        location: "/"
    });

    test.deepEqual(entry.location, []);

    var entry: blaze.AccessEntry = blaze.AccessEntry.parse({
        location: ""
    });

    test.deepEqual(entry.location, []);

    test.done();
}