var clock = require('../');

var clockTypes = [
	'REALTIME',
	'MONOTONIC',
	'REALTIME_COARSE',
	'MONOTONIC_COARSE',
	'MONOTONIC_RAW',
	'BOOTTIME',
	'PROCESS_CPUTIME_ID',
	'THREAD_CPUTIME_ID'
];

console.log('Available constants:',  clock);

exports.gettime = function(test) {
	clockTypes.forEach(function(clockId) {
		if(clock[clockId] === undefined) {
			// clock is not supported by system
			return;
		}

		try {
			var result = clock.gettime(clock[clockId]);
		} catch(e) {
			// clock is exposed, but not supported
			return;
		}

		test.notEqual(result.sec, undefined);
		test.notEqual(result.nsec, undefined);
	});

	test.done();
}

exports.getres = function(test) {
	clockTypes.forEach(function(clockId) {
		if(clock[clockId] === undefined) {
			// clock is not supported by system
			return;
		}

		try {
			var result = clock.getres(clock[clockId]);
		} catch(e) {
			// clock is exposed, but not supported
			return;
		}

		test.notEqual(result.sec, undefined);
		test.notEqual(result.nsec, undefined);
	});

	test.done();
}
