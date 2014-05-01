module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		//see https://github.com/gruntjs/grunt-contrib-nodeunit
		//only files ending in _test.js in directory and subdirectories of test are run
		nodeunit: {
			all: ['test/**/*.js'],
            validation : ['test/validation.js'],
            codegen : ['test/codegen.js'],
            expressions: ['test/expressions.js']
		}
	});

	// Load the plugins for this project
	grunt.loadNpmTasks('grunt-contrib-nodeunit');


	// Default task(s).
	grunt.registerTask('default', ['nodeunit']);

    //default test
    grunt.registerTask('test',   ["nodeunit:all"]);

};