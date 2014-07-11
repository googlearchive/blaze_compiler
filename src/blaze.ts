/// <reference path="../types/node.d.ts" />
/// <reference path="../types/optimist.d.ts" />

import compile = require('./compile');
var configured_optimist = require('optimist')
    .usage([
        'run:-',
        'blaze <file>',
        'to generate a rules.json in the current directory, ready for upload to Firebase',
    ].join("\n"))
    .boolean('v')
    .describe('v', 'enable debug output')
    .boolean('java');
//    .describe('java', '(experimental) generate a java sources');

var argv = configured_optimist.argv;

var file = argv._[0];


if(file){
    if (argv['v']) console.log("args", argv);

    console.log("transpiling", file);
    var model = compile.compile(file, argv['v']);
    if (argv['java']) require('./java').generate(model, argv['v'])
} else {
    configured_optimist.showHelp()
}


