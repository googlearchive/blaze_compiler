var optimist = require('optimist');
var compile = require('./compile');

var argv = optimist.usage('blaze <file>').argv;

var file = argv._[0];

console.log("transpiling", file);

compile.compile(file);
//# sourceMappingURL=blaze.js.map
