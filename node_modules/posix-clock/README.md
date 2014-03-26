# POSIX `clock_*()` for NodeJS [![Build Status](https://secure.travis-ci.org/avz/node-posix-clock.png?branch=master)](http://travis-ci.org/avz/node-posix-clock)

## Installation
```
npm install posix-clock
```

## Examples
### clock_getres()
```javascript
var clock = require('posix-clock');

var clockResolution = clock.getres(clock.MONOTONIC);
console.log(
	'Resolution of CLOCK_MONOTONIC: '
		+ clockResolution.sec + ' sec and '
		+ clockResolution.nsec + ' nanosec.'
	, clockResolution
);
```

```
Resolution of CLOCK_MONOTONIC: 0 sec and 1 nanosec. { sec: 0, nsec: 1 }
```

### clock_gettime()
```javascript
var clock = require('posix-clock');

var clockTime = clock.gettime(clock.MONOTONIC);
console.log(
	'Time from CLOCK_MONOTONIC: '
		+ clockTime.sec + ' sec and '
		+ clockTime.nsec + ' nanosec.'
	, clockTime
);
```

```
Time from CLOCK_MONOTONIC: 15224 sec and 557776233 nanosec. { sec: 15224, nsec: 557776233 }
```

### clock_nanosleep()
```javascript
var clock = require('posix-clock');

// sleep until 13 Feb 2009 23:31:30 UTC (Unix Timestamp = 1234567890)
clock.nanosleep(
	clock.REALTIME,
	clock.TIMER_ABSTIME,
	{
		sec: 1234567890,
		nsec: 0
	}
);

// sleep at least 10 seconds and 123 nanoseconds
clock.nanosleep(
	clock.REALTIME,
	0,
	{
		sec: 10,
		nsec: 123
	}
);
```

## API

### Methods

 * `gettime(clockId)` - the function retrieve the time from the specified clock clockId.
See [man 2 clock_gettime](http://man7.org/linux/man-pages/man2/clock_gettime.2.html) for more details.
 * `getres(clockId)` - the function return the resolution (precision) of the
specified clock clockId. The resolution of clocks depends on the implementation and cannot be
configured by a particular process.
See [man 2 clock_getres](http://man7.org/linux/man-pages/man2/clock_getres.2.html) for more details.
 * `nanosleep(clockId, flags, sleepTime)` - high resolution sleep with specifiable clock.
If the flag `TIMER_ABSTIME` is not set in the `flags` argument, the `nanosleep()`
function shall cause the current thread to be suspended from execution until
either the time interval specified by the `sleepTime` argument has elapsed,
or a signal is delivered to the calling thread and its action is to invoke a
signal-catching function, or the process is terminated.
The clock used to measure the time shall be the clock specified by clockId.
See [man 2 clock_nanosleep](http://man7.org/linux/man-pages/man2/clock_nanosleep.2.html) for more details.
**On non-linux OS only `nanosleep(REALTIME, 0, {...})` is supported**.

### Clocks

 * `REALTIME` - system-wide clock that measures real (i.e., wall-clock) time.
This clock is affected by discontinuous jumps in
the system time (e.g., if the system administrator
manually changes the clock), and by the incremental adjustments
performed by adjtime(3) and NTP.

 * `MONOTONIC` - clock that cannot be set and represents monotonic time since some
unspecified starting point. This clock is not affected by discontinuous
jumps in the system time (e.g., if the system administrator
manually changes the clock), but is affected by the incremental adjustments
performed by adjtime(3) and NTP.

#### Linux-specific

 * `PROCESS_CPUTIME_ID` - *since Linux 2.6.12*.
High-resolution per-process timer from the CPU.

 * `THREAD_CPUTIME_ID` - *since Linux 2.6.12*.
Thread-specific CPU-time clock.

 * `REALTIME_COARSE` - *since Linux 2.6.32; Linux-specific*.
A faster but less precise version of `REALTIME`.
Use when you need very fast, but not fine-grained timestamps.

 * `MONOTONIC_COARSE` - *since Linux 2.6.32; Linux-specific*.
A faster but less precise version of `MONOTONIC`.
Use when you need very fast, but not fine-grained timestamps.

 * `MONOTONIC_RAW` - *since Linux 2.6.28; Linux-specific*.
Similar to `MONOTONIC`, but provides access to a raw hardware-based time
that is not subject to NTP adjustments or the incremental adjustments
performed by adjtime(3).

 * `BOOTTIME` - *since Linux 2.6.39; Linux-specific*
Identical to `MONOTONIC`, except it also includes
any time that the system is suspended.  This allows applications to get
a suspend-aware monotonic clock without having to deal with
the complications of `REALTIME`, which may have discontinuities
if the time is changed using settimeofday(2).

#### FreeBSD-specific

 * `REALTIME_FAST` - analog of `REALTIME` but do not perform a full time
counter query, so their accuracy is one timer tick
 * `REALTIME_PRECISE` - analog of `REALTIME` but get the most exact value
as possible, at the expense of execution time
 * `MONOTONIC_FAST` - analog of `MONOTONIC` but do not perform a full time
counter query, so their accuracy is one timer tick
 * `MONOTONIC_PRECISE` - analog of `MONOTONIC` but get the most exact value
as possible, at the expense of execution time
 * `UPTIME` - which starts at zero when the kernel boots and increments
monotonically in SI seconds while the machine is running
 * `UPTIME_FAST` - analog of `UPTIME` but do not perform a full time
counter query, so their accuracy is one timer tick
 * `UPTIME_PRECISE` - analog of `UPTIME` but get the most exact value
as possible, at the expense of execution time
 * `SECOND` - returns the current second without performing a full
time counter query, using in-kernel cached value of current second.
 * `PROF` - for time that increments when the CPU is running in user or kernel mode
