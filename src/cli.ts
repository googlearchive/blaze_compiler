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
    .string('target')
    .describe('target', 'target directory for output').default(".")
    .boolean('watch')
    .describe('watch', 'continuous compilation')
    .boolean('java');
    //.describe('java', '(experimental) generate a Java client');

import fs = require('fs');

var argv = configured_optimist.argv;
var file = argv._[0];
var target_dir = argv.target;

var lastCompileTime: number = -1;

function compile() {
    var model = compiler.compile(file, target_dir, argv['v']);
    if (argv['java']) require('./java/java').generate(model, target_dir, argv['v']);
}

function compileIfNew() {
    if (fs.statSync(file).mtime.getTime() > lastCompileTime) {
        lastCompileTime = fs.statSync(file).mtime.getTime();
        compile();
    }
    if (argv.watch) {
        setTimeout(compileIfNew, 1000);
    }
}

if(file){
    if (argv['v']) console.log("args", argv);
    compileIfNew();
} else {
    configured_optimist.showHelp()
}


