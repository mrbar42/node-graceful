# node-graceful

[![Build Status](https://travis-ci.org/mrbar42/node-graceful.svg?branch=master)](https://travis-ci.org/mrbar42/node-graceful) [![npm](https://img.shields.io/npm/v/node-graceful.svg)](https://www.npmjs.com/package/node-graceful) ![npm bundle size (version)](https://img.shields.io/bundlephobia/minzip/node-graceful?label=Install%20size)

node-graceful is a small helper module without dependencies that aims to ease graceful exit
 of complex node programs including async waiting on multiple independent modules.

Installation:
```sh
npm i -S node-graceful

yarn add node-graceful
```

Had any problem? open an [issue](https://github.com/mrbar42/node-graceful/issues/new)

## Quick example

Typescript
```typescript
import Graceful from 'node-graceful';
Graceful.captureExceptions = true;

Graceful.on('exit', async () => {
  await server.close();
});
```

Plain JS
```javascript
const Graceful = require('node-graceful');
Graceful.captureExceptions = true;

Graceful.on('exit', async () => {
    console.log(`Received ${signal} - Exiting gracefully`);
    await webServer.close(); 
});

//  Graceful will wait until all listeners had finished
Graceful.on('exit', (signal) => {
    return new Promise((resolve) => {
        console.log("Another independent listener!");
        setTimeout(() => resolve(), 1000);    
    });
});
```

## Quick Docs

```typescript
interface Graceful {
    // add exit listener
    on(signal: 'exit', listener: GracefulListener): GracefulSubscription;
    // remove exit listener
    off(signal: 'exit', listener: GracefulListener): void;
    // remove all exit listeners
    clear(): void;
    // trigger graceful process exit with or without exit code and signal
    exit(): void;
    exit(exitCode: number): void;
    exit(exitSignal: string): void;
    exit(exitCode: number, exitSignal: string): void;

    // whether to exit immediately when a second kill signal is received
    exitOnDouble: boolean; // default: true
    // maximum time to wait before hard-killing the process
    timeout: number; // default: 30000
    // whether to treat uncaught exceptions as process terminating events
    captureExceptions: boolean; // default: false
    // whether to treat unhandled promise rejections as process terminating events
    captureRejections: boolean; // default: false
}

type GracefulListener = (signal: string, details?: object) => (void | any | Promise<any> | Promise<Error>);
type GracefulSubscription = () => void;
```
Read bellow for full API reference.

## API Reference

### Graceful.on('exit', {Function} listener)

Add exit listener to be called when process exit is triggered.
`Graceful` listens on all terminating signals and triggers `exit` accordingly.

Terminating events: `SIGTERM` `SIGINT` `SIGBREAK` `SIGHUP`

#### Options
- `listener(signal, details?)` - listener function
    - `signal` - the signal that triggered the exit. example: 'SIGTERM'
    - `details` - optional details provided by the trigger. for example in case of `unhandledException` this will be an error object. on external signal it will be undefined.

#### Examples
The listener function can return a promise that will delay the process exit until it's fulfilment.
```typescript
Graceful.on('exit', () => Promise.resolve('I Am A Promise!'));
Graceful.on('exit', async () => {
  // async function always returns promise so shutdown will be delayed until this functions ends
  await webServer.close();

  return Promise.all([
    controller.close(),
    dbClient.close()
  ]);
});
```

if old style callback is needed, wrap the logic with a promise
```javascript
const server = require('http').createServer(function (req, res) {
    res.write('ok');
    res.end()
})
Graceful.on('exit', () => {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});
```

#### Return value
the method returns a function that when invoked, removes the listener subscription.
the function is a shorthand for `.off` method

##### example
```typescript
// use the return value to remove listener
const removeListener = Graceful.on('exit', () => {});
removeListener(); // listener was removed and will not be triggered
```

### Graceful.off('exit', {Function} listener)

Remove a previously subscribed listener.

##### example
```typescript
const gracefulExit = () => {
    console.log("exiting!");
};

// add listener
let removeListener = Graceful.on('SIGTERM', gracefulExit);

// remove listener
Graceful.off('SIGTERM', gracefulExit);
// same as invoking the return value
// removeListener();
```


### Graceful.clear()

Unsubscribe all `exit` listeners.

##### example
```javascript
// add listener
Graceful.on('exit', () => {
   console.log("Received some exit signal!");
   return Promise.resolve("A promise to be waited on before dying");
});

Graceful.on('exit', (done) => {
   console.log("Another listener");
   done();
});

// remove all listener
Graceful.clear();
```

### Graceful.exit({Number} \[code], {String} \[signal])

Trigger graceful process exit.
This method is meant to be a substitute command for `process.exit()`
to allow other modules to exit gracefully in case of error.

- `code` - (optional) exit code to be used. default - `process.exitCode`
- `signal` - (optional) signal to be simulating for listeners. default - `SIGTERM`

##### example
```javascript

server.listen(3333)
        .on('listening', function () {
            console.log('Yay!')
        })
        .on('error', function (err) {
            if (err.code === 'EADDRINUSE') {
                console.error("Damn, Port is already in use...");
                Graceful.exit();
            }
        });

// exit code and signal can be specified
// Graceful.exit(1);
// Graceful.exit(1, 'SIGINT');
// Graceful.exit('SIGINT');
```

## Options

Options are global and shared, any change will override previous values.

#### Graceful.exitOnDouble = true {boolean}

Whether to exit immediately when a second deadly event is received,
For example when Ctrl-C is pressed twice etc..
When exiting due to double event, exit code will be `process.exitCode` or `1` (necessarily a non-zero)

#### Graceful.timeout = 30000 {number}

Maximum time to wait for exit listeners in `ms`.
After exceeding the time, the process will force exit
and the exit code will be `process.exitCode` or `1` (necessarily a non-zero)

Setting the timeout to `0` will disable timeout functionality (will wait indefinitely)

#### Graceful.captureExceptions = false {boolean}

Whether to treat `uncaughtException` event as a terminating event and trigger graceful shutdown.

```typescript
Graceful.captureExceptions = true;

throw new Error('DANG!'); // this will now trigger graceful shutdown 
```

#### Graceful.captureRejections = false {boolean}

Whether to treat `unhandledRejection` event as a terminating event and trigger graceful shutdown.
On newer `node` versions `unhandledRejection` is in-fact a terminating event

```typescript
Graceful.captureRejections = true;

Promise.reject(new Error('DANG!')); // this will now trigger graceful shutdown 
```

#### exitCode

`Graceful` will obey `process.exitCode` property value when exiting unless the exit is forced (double signal, timeout) in which case the exit code must be non-zero. 
