/// <reference path="../types/node.d.ts" />
/// <reference path="../types/optimist.d.ts" />
require('source-map-support').install();
import compiler = require('./compiler');
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
    var model = compiler.compile(file, argv['v']);
    if (argv['java']) require('./java/java').generate(model, argv['v'])
} else {
    configured_optimist.showHelp()
}


