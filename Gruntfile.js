module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		//see https://github.com/gruntjs/grunt-contrib-nodeunit
		//only files ending in _test.js in directory and subdirectories of test are run
		nodeunit: {
			all: ['test/**/*_test.js'],
            validation : ['test/validation_test.js'],
            codegen : ['test/codegen_test.js'],
            expressions: ['test/expressions_test.js'],
            optimize: ['test/optimize_test.js'],
            mail: ['test/mail_example_test.js'],
            parse: ['test/parse_test.js'],
            scenarios: ['test/scenarios_test.js'],
		},typescript: {
          base: {
            src: ['src/**/*.ts', 'test/**/*.ts'],
            dest: '.',
            options: {
              module: 'commonjs',
              target: 'es5',
              sourceMap: true,
              declaration: false
            }
          }
        }
	});

	// Load the plugins for this project
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-typescript');

	// Default task(s).
	grunt.registerTask('default', ['nodeunit']);

    //default test
    grunt.registerTask('test',   ["nodeunit:all"]);
    grunt.registerTask('compile',["typescript:base"]);
};