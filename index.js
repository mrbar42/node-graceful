// +----------------------------------------------------------------------+
// | node-graceful v3 (https://github.com/mrbar42/node-graceful)      |
// | Graceful process exit manager.                                       |
// |----------------------------------------------------------------------|
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var Graceful = /** @class */ (function () {
    function Graceful() {
    }
    Object.defineProperty(Graceful, "captureExceptions", {
        get: function () {
            return Graceful._captureExceptions;
        },
        set: function (newValue) {
            if (Graceful._captureExceptions === newValue)
                return;
            Graceful._captureExceptions = newValue;
            if (Graceful._captureExceptions) {
                process.on('uncaughtException', Graceful.exceptionListener);
            }
            else {
                process.removeListener('uncaughtException', Graceful.exceptionListener);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Graceful, "captureRejections", {
        get: function () {
            return Graceful._captureRejections;
        },
        set: function (newValue) {
            if (Graceful._captureRejections === newValue)
                return;
            Graceful._captureRejections = newValue;
            if (Graceful._captureRejections) {
                process.on('unhandledRejection', Graceful.rejectionListener);
            }
            else {
                process.removeListener('unhandledRejection', Graceful.rejectionListener);
            }
        },
        enumerable: false,
        configurable: true
    });
    Graceful.on = function (signal, listener) {
        if (signal !== 'exit')
            throw new Error('Only supports \'exit\' signal');
        Graceful.listeners.push(listener);
        Graceful.updateRegistration();
        return function () { return Graceful.off('exit', listener); };
    };
    Graceful.off = function (signal, listener) {
        if (signal !== 'exit')
            throw new Error('Only supports \'exit\' signal');
        var index = Graceful.listeners.indexOf(listener);
        if (index !== -1)
            Graceful.listeners.splice(index, 1);
        Graceful.updateRegistration();
    };
    Graceful.clear = function () {
        Graceful.listeners.splice(0, Infinity);
        Graceful.updateRegistration();
    };
    Graceful.exit = function (code, signal) {
        if (signal === void 0) { signal = 'SIGTERM'; }
        var exitSignal = typeof code === 'string' ? code : signal;
        if (typeof code === 'number') {
            process.exitCode = code;
        }
        Graceful.onDeadlyEvent(exitSignal, { reason: 'Manual call to Graceful.exit()' });
    };
    Graceful.onDeadlyEvent = function (signal, details) {
        // console.log(signal, details);
        if (Graceful.isExiting) {
            if (Graceful.exitOnDouble)
                Graceful.killProcess(true);
            return;
        }
        var listeners = Graceful.listeners.slice(0);
        Graceful.isExiting = true;
        var completedListeners = 0;
        var done = function () {
            completedListeners++;
            if (completedListeners === listeners.length) {
                Graceful.killProcess(false);
            }
        };
        if (Number(Graceful.timeout)) {
            var timeoutRef = setTimeout(function () { return Graceful.killProcess(true); }, Graceful.timeout);
            if (timeoutRef && timeoutRef.unref)
                timeoutRef.unref();
        }
        for (var _i = 0, listeners_1 = listeners; _i < listeners_1.length; _i++) {
            var listener = listeners_1[_i];
            Graceful.invokeListener(listener, done, signal, details);
        }
    };
    Graceful.invokeListener = function (listener, done, signal, details) {
        var invoked = false;
        var listenerDone = function () {
            if (!invoked) {
                invoked = true;
                done();
            }
        };
        var retVal = listener(signal, details);
        // allow returning a promise
        if (retVal && typeof retVal.then === 'function') {
            retVal.then(listenerDone, listenerDone);
        }
        else {
            listenerDone();
        }
    };
    Graceful.updateRegistration = function () {
        if (Graceful.listeners.length && !Graceful.isRegistered) {
            var _loop_1 = function (deadlySignal) {
                var listener = function () { return Graceful.onDeadlyEvent(deadlySignal); };
                Graceful.signalsListeners[deadlySignal] = listener;
                process.on(deadlySignal, listener);
            };
            for (var _i = 0, _a = Graceful.DEADLY_SIGNALS; _i < _a.length; _i++) {
                var deadlySignal = _a[_i];
                _loop_1(deadlySignal);
            }
            Graceful.isRegistered = true;
        }
        else if (!Graceful.listeners.length && Graceful.isRegistered) {
            for (var _b = 0, _c = Graceful.DEADLY_SIGNALS; _b < _c.length; _b++) {
                var deadlySignal = _c[_b];
                var listener = Graceful.signalsListeners[deadlySignal];
                if (listener) {
                    process.removeListener(deadlySignal, listener);
                    delete Graceful.signalsListeners[deadlySignal];
                }
            }
            Graceful.isRegistered = false;
        }
    };
    Graceful.killProcess = function (force) {
        process.exit(process.exitCode || (force ? 1 : 0));
    };
    Graceful.DEADLY_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGBREAK', 'SIGHUP'];
    Graceful.exitOnDouble = true;
    Graceful.timeout = 30000;
    Graceful._captureExceptions = false;
    Graceful._captureRejections = false;
    Graceful.listeners = [];
    Graceful.isRegistered = false;
    Graceful.isExiting = false;
    Graceful.exceptionListener = function (event) {
        process.exitCode = 1;
        Graceful.onDeadlyEvent('uncaughtException', event);
    };
    Graceful.rejectionListener = function (event) {
        process.exitCode = 1;
        Graceful.onDeadlyEvent('unhandledRejection', event);
    };
    Graceful.signalsListeners = {};
    return Graceful;
}());
exports.default = Graceful;
// @ts-ignore - simulate default export in way Typescript can't understand
Graceful.default = exports.default;
// Support all the possible commonjs variations including Typescript
module.exports = Graceful;
Object.defineProperty(Graceful, "__esModule", { value: true });
