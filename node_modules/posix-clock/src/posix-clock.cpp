#include <node.h>
#include <v8.h>
#include <time.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>

using namespace v8;

#define AVZ_DEFINE_CONSTANT(target, name, value) \
		(target)->Set(v8::String::NewSymbol(name), \
		v8::Integer::New(value), \
		static_cast<v8::PropertyAttribute>(v8::ReadOnly|v8::DontDelete))

#define AVZ_FILL_TIMESPEC(target, sec, nsec) \
		(target)->Set(String::NewSymbol("sec"), Number::New(sec)); \
		(target)->Set(String::NewSymbol("nsec"), Integer::NewFromUnsigned(static_cast<uint32_t>(nsec)));

#define AVZ_VALIDATE_ARG_CLOCKID(arg) \
		if(!(arg)->IsInt32()) { \
			ThrowException(Exception::Error(String::New("Specified clockId is not supported on this system"))); \
			return scope.Close(Undefined()); \
		}

Handle<Value> ClockGetTime(const Arguments& args) {
	HandleScope scope;

	if(args.Length() != 1) {
		ThrowException(Exception::TypeError(String::New("Wrong number of arguments")));
		return scope.Close(Undefined());
	}

	AVZ_VALIDATE_ARG_CLOCKID(args[0]);

	clockid_t clockId = args[0]->Int32Value();
	struct timespec ts;

	if(clock_gettime(clockId, &ts) != 0) {
		if(errno == EINVAL)
			ThrowException(Exception::Error(String::New("Specified clockId is not supported on this system")));
		else
			ThrowException(Exception::Error(String::Concat(String::New(strerror(errno)), args[0]->ToString())));

		return scope.Close(Undefined());
	}

	Local<Object> obj = Object::New();

	AVZ_FILL_TIMESPEC(obj, ts.tv_sec, ts.tv_nsec);

	return scope.Close(obj);
}

Handle<Value> ClockGetRes(const Arguments& args) {
	HandleScope scope;

	if(args.Length() != 1) {
		ThrowException(Exception::TypeError(String::New("Wrong number of arguments")));
		return scope.Close(Undefined());
	}

	AVZ_VALIDATE_ARG_CLOCKID(args[0]);

	clockid_t clockId = args[0]->Int32Value();
	struct timespec ts;

	if(clock_getres(clockId, &ts) != 0) {
		if(errno == EINVAL)
			ThrowException(Exception::Error(String::New("Specified clockId is not supported on this system")));
		else
			ThrowException(Exception::Error(String::Concat(String::New(strerror(errno)), args[0]->ToString())));

		return scope.Close(Undefined());
	}

	Local<Object> obj = Object::New();

	AVZ_FILL_TIMESPEC(obj, ts.tv_sec, ts.tv_nsec);

	return scope.Close(obj);
}

Handle<Value> ClockNanosleep(const Arguments& args) {
	HandleScope scope;

	if(args.Length() != 3) {
		ThrowException(Exception::TypeError(String::New("Wrong number of arguments")));
		return scope.Close(Undefined());
	}

	AVZ_VALIDATE_ARG_CLOCKID(args[0]);

	clockid_t clockId = args[0]->Int32Value();
	int flags = args[1]->Int32Value();

	if(!args[2]->IsObject()) {
		ThrowException(Exception::Error(String::New("Sleep time must be an object, e.g. {sec: 1212, nsec: 4344}")));
		return scope.Close(Undefined());
	}

	struct timespec sleepTimeTs;
	struct timespec remainingTimeTs;

	Local<Object> objSleep = args[2]->ToObject();
	Local<Value> secValue = objSleep->Get(String::New("sec"));
	Local<Value> nsecValue = objSleep->Get(String::New("nsec"));

	if(!secValue->IsUndefined() && !secValue->IsUint32()) {
		ThrowException(Exception::Error(String::New("Option `sec` must be unsigned integer")));
		return scope.Close(Undefined());
	}

	if(!nsecValue->IsUndefined() && !nsecValue->IsUint32()) {
		ThrowException(Exception::Error(String::New("Option `nsec` must be unsigned integer")));
		return scope.Close(Undefined());
	}

	sleepTimeTs.tv_sec = (time_t)secValue->Uint32Value();
	sleepTimeTs.tv_nsec = (long)nsecValue->Uint32Value();

	if(sleepTimeTs.tv_nsec < 0 || sleepTimeTs.tv_nsec >= 1e9) {
		ThrowException(Exception::Error(String::New("Option `nsec` must be in [0; 999999999]")));
		return scope.Close(Undefined());
	}

#ifdef __linux__
	int err = clock_nanosleep(clockId, flags, &sleepTimeTs, &remainingTimeTs);

	if(err != 0) {
		if(err == EINVAL) {
			ThrowException(Exception::Error(String::New("Specified clockId is not supported on this system or invalid argument")));
		} else if(err == EINTR) {
			/* stopped by signal - need to return remaining time */
			struct timespec *res;

			if(flags & TIMER_ABSTIME)
				res = &sleepTimeTs;
			else
				res = &remainingTimeTs;

			Local<Object> obj = Object::New();
			AVZ_FILL_TIMESPEC(obj, res->tv_sec, res->tv_nsec);
			return scope.Close(obj);
		} else {
			ThrowException(Exception::Error(String::Concat(String::Concat(String::New(strerror(err)), String::New(": ")), args[0]->ToString())));
		}
	}
#else
	if(clockId != CLOCK_REALTIME) {
		ThrowException(Exception::Error(String::New("Only nanosleep(REALTIME) clock is supported by your OS")));
		return scope.Close(Undefined());
	}

	if(flags & TIMER_ABSTIME) {
		ThrowException(Exception::Error(String::New("Flag nanosleep(TIMER_ABSTIME) is not supported by your OS")));
		return scope.Close(Undefined());
	}

	int err = nanosleep(&sleepTimeTs, &remainingTimeTs);

	if(err == -1) {
		if(errno == EINTR) {
			Local<Object> obj = Object::New();
			AVZ_FILL_TIMESPEC(obj, remainingTimeTs.tv_sec, remainingTimeTs.tv_nsec);
			return scope.Close(obj);
		} else {
			ThrowException(Exception::Error(String::Concat(String::Concat(String::New(strerror(err)), String::New(": ")), args[0]->ToString())));
			return scope.Close(Undefined());
		}
	}
#endif

	return scope.Close(Undefined());
}

extern "C"
void init(Handle<Object> exports) {
	exports->Set(String::NewSymbol("gettime"), FunctionTemplate::New(ClockGetTime)->GetFunction());
	exports->Set(String::NewSymbol("getres"), FunctionTemplate::New(ClockGetRes)->GetFunction());
	exports->Set(String::NewSymbol("nanosleep"), FunctionTemplate::New(ClockNanosleep)->GetFunction());

#ifdef TIMER_ABSTIME
	AVZ_DEFINE_CONSTANT(exports, "TIMER_ABSTIME", TIMER_ABSTIME); // for nanosleep
#endif

	AVZ_DEFINE_CONSTANT(exports, "REALTIME", CLOCK_REALTIME);
	AVZ_DEFINE_CONSTANT(exports, "MONOTONIC", CLOCK_MONOTONIC);

	/* Linux-specific constants */
#ifdef CLOCK_REALTIME_COARSE
	AVZ_DEFINE_CONSTANT(exports, "REALTIME_COARSE", CLOCK_REALTIME_COARSE);
#endif

#ifdef CLOCK_MONOTONIC_COARSE
	AVZ_DEFINE_CONSTANT(exports, "MONOTONIC_COARSE", CLOCK_MONOTONIC_COARSE);
#endif

#ifdef CLOCK_MONOTONIC_RAW
	AVZ_DEFINE_CONSTANT(exports, "MONOTONIC_RAW", CLOCK_MONOTONIC_RAW);
#endif

#ifdef CLOCK_BOOTTIME
	AVZ_DEFINE_CONSTANT(exports, "BOOTTIME", CLOCK_BOOTTIME);
#endif

#ifdef CLOCK_PROCESS_CPUTIME_ID
	AVZ_DEFINE_CONSTANT(exports, "PROCESS_CPUTIME_ID", CLOCK_PROCESS_CPUTIME_ID);
#endif

#ifdef CLOCK_THREAD_CPUTIME_ID
	AVZ_DEFINE_CONSTANT(exports, "THREAD_CPUTIME_ID", CLOCK_THREAD_CPUTIME_ID);
#endif

	/* FreeBSD-specific constants */
#ifdef CLOCK_REALTIME_FAST
	AVZ_DEFINE_CONSTANT(exports, "REALTIME_FAST", CLOCK_REALTIME_FAST);
#endif

#ifdef CLOCK_REALTIME_PRECISE
	AVZ_DEFINE_CONSTANT(exports, "REALTIME_PRECISE", CLOCK_REALTIME_PRECISE);
#endif

#ifdef CLOCK_MONOTONIC_FAST
	AVZ_DEFINE_CONSTANT(exports, "MONOTONIC_FAST", CLOCK_MONOTONIC_FAST);
#endif

#ifdef CLOCK_MONOTONIC_PRECISE
	AVZ_DEFINE_CONSTANT(exports, "MONOTONIC_PRECISE", CLOCK_MONOTONIC_PRECISE);
#endif

#ifdef CLOCK_UPTIME
	AVZ_DEFINE_CONSTANT(exports, "UPTIME", CLOCK_UPTIME);
#endif

#ifdef CLOCK_UPTIME_FAST
	AVZ_DEFINE_CONSTANT(exports, "UPTIME_FAST", CLOCK_UPTIME_FAST);
#endif

#ifdef CLOCK_UPTIME_PRECISE
	AVZ_DEFINE_CONSTANT(exports, "THREAD_UPTIME_PRECISE", CLOCK_UPTIME_PRECISE);
#endif

#ifdef CLOCK_SECOND
	AVZ_DEFINE_CONSTANT(exports, "THREAD_SECOND", CLOCK_SECOND);
#endif

#ifdef CLOCK_PROF
	AVZ_DEFINE_CONSTANT(exports, "PROF", CLOCK_PROF);
#endif
}

//--

NODE_MODULE(posix_clock, init)
