var binding = require(__dirname + '/build/Release/posix-clock');

/**
 * The functions retrieve the time of the specified clock clockId.
 * @param {Integer} clockId Clock identifier, specified by constant
 * @returns {Object} Struct {sec: 12233, nsec: 3433434}
 */
exports.gettime = binding.gettime;

/**
 * The function finds the resolution (precision) of the
 * specified clock clockId.
 * The resolution of clocks depends on the implementation and cannot be
 * configured by a particular process.
 * @param {Integer} clockId Clock identifier, specified by constant
 * @returns {Object} Struct {sec: 12233, nsec: 3433434}
 */
exports.getres = binding.getres;

/**
 * high resolution sleep with specifiable clock.
 * If the flag `TIMER_ABSTIME` is not set in the `flags` argument, the `nanosleep()`
 * function shall cause the current thread to be suspended from execution until
 * either the time interval specified by the `sleepTime` argument has elapsed,
 * or a signal is delivered to the calling thread and its action is to invoke a
 * signal-catching function, or the process is terminated.
 * The clock used to measure the time shall be the clock specified by clockId.
 * @warning not supported on FreeBSD
 * @param {Integer} clockId
 * @param {Integer} flags
 * @param {Object} sleepTime {sec: 1, nsec: 1223}
 * @returns {undefined}
 */
exports.nanosleep = binding.nanosleep;

/**
 * System-wide clock that measures real (i.e., wall-clock) time.
 * Setting this clock requires appropriate privileges.
 * This clock is affected by discontinuous jumps in
 * the system time (e.g., if the system administrator
 * manually changes the clock), and by the incremental adjustments
 * performed by adjtime(3) and NTP.
 */
exports.REALTIME = binding.REALTIME;

/**
 * Clock that cannot be set and represents monotonic time since some
 * unspecified starting point. This clock is not affected by discontinuous
 * jumps in the system time (e.g., if the system administrator
 * manually changes the clock), but is affected by the incremental adjustments
 * performed by adjtime(3) and NTP.
 */
exports.MONOTONIC = binding.MONOTONIC;


/* ------------------- Linux-specific -------------------- */

/**
 * @warning since Linux 2.6.32; Linux-specific
 * A faster but less precise version of REALTIME.
 * Use when you need very fast, but not fine-grained timestamps.
 */
exports.REALTIME_COARSE = binding.REALTIME_COARSE;

/**
 * @warning since Linux 2.6.32; Linux-specific
 * A faster but less precise version of MONOTONIC.
 * Use when you need very fast, but not fine-grained timestamps.
 */
exports.MONOTONIC_COARSE = binding.MONOTONIC_COARSE;

/**
 * @warning since Linux 2.6.28; Linux-specific
 * Similar to MONOTONIC, but provides access to a raw hardware-based time
 * that is not subject to NTP adjustments or the incremental adjustments
 * performed by adjtime(3).
 */
exports.MONOTONIC_RAW = binding.MONOTONIC_RAW;

/**
 * @warning since Linux 2.6.39; Linux-specific
 * Identical to MONOTONIC, except it also includes
 * any time that the system is suspended.  This allows applications to get
 * a suspend-aware monotonic clock without having to deal with
 * the complications of REALTIME, which may have discontinuities
 * if the time is changed using settimeofday(2).
 */
exports.BOOTTIME = binding.BOOTTIME;

/**
 * @warning since Linux 2.6.12
 * High-resolution per-process timer from the CPU.
 */
exports.PROCESS_CPUTIME_ID = binding.PROCESS_CPUTIME_ID;

/**
 * @warning since Linux 2.6.12
 * Thread-specific CPU-time clock.
 */
exports.THREAD_CPUTIME_ID = binding.THREAD_CPUTIME_ID;


/* ---------------- FreeBSD-specific ----------------- */

/**
 * analog of `REALTIME` but do not perform a full time
 * counter query, so their accuracy is one timer tick
 */
exports.REALTIME_FAST = binding.REALTIME_FAST;

/**
 * analog of `REALTIME` but get the most exact value
 * as possible, at the expense of execution time
 */
exports.REALTIME_PRECISE = binding.REALTIME_PRECISE;

/**
 * analog of `MONOTONIC` but do not perform a full time
 * counter query, so their accuracy is one timer tick
 */
exports.MONOTONIC_FAST = binding.MONOTONIC_FAST;

/**
 * analog of `MONOTONIC` but get the most exact value
 * as possible, at the expense of execution time
 */
exports.MONOTONIC_PRECISE = binding.MONOTONIC_PRECISE;

/**
 * starts at zero when the kernel boots and increments monotonically in SI
 * seconds while the machine is running
 */
exports.UPTIME = binding.UPTIME;

/**
 * analog of `UPTIME` but do not perform a full time
 * counter query, so their accuracy is one timer tick
 */
exports.UPTIME_FAST = binding.UPTIME_FAST;

/**
 * analog of `UPTIME` but get the most exact value
 * as possible, at the expense of execution time
 */
exports.UPTIME_PRECISE = binding.UPTIME_PRECISE;

/**
 * returns the current second without performing a full
 * time counter query, using in-kernel cached value of current second.
 */
exports.SECOND = binding.SECOND;

/**
 * for time that increments when the CPU is running in user or kernel mode
 */
exports.PROF = binding.PROF;

exports.TIMER_ABSTIME = binding.TIMER_ABSTIME;