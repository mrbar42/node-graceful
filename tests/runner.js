'use strict';

// this is a small testing script to avoid heavy external testing dependencies

const execFile = require('child_process').execFile;

let tests = [
    {
        name: 'Async wait',
        child: './async-exit',
        expectedOutput: 'ok',
        expectedExitCode: 0
    },
    {
        name: 'SIGTERM exit',
        child: './sigterm-exit',
        signal: 'SIGTERM',
        expectedOutput: 'ok',
        expectedExitCode: 0
    },
    {
        name: 'SIGINT exit',
        child: './sigint-exit',
        signal: 'SIGINT',
        expectedOutput: 'ok',
        expectedExitCode: 0
    },
    {
        name: 'SIGHUP exit',
        child: './sighup-exit',
        signal: 'SIGHUP',
        expectedOutput: 'ok',
        expectedExitCode: 0
    },
    {
        name: 'Timeout exit',
        child: './exit-timeout',
        signal: 'SIGTERM',
        expectedOutput: 'ok1',
        expectedExitCode: 1
    },
    {
        name: 'Multiple listeners',
        child: './multiple-listeners',
        expectedOutput: 'ok',
        expectedExitCode: 0
    },
    {
        name: 'Forced exit',
        child: './forced-exit',
        expectedOutput: '',
        expectedExitCode: 1
    },
    {
        name: 'Self triggered',
        child: './self-triggered',
        expectedOutput: 'ok',
        expectedExitCode: 0
    },
    {
        name: 'Clear listeners',
        child: './clear-listeners',
        expectedOutput: '',
        expectedExitCode: 0
    },
    {
        name: 'Exit on double',
        child: './exit-on-double',
        expectedOutput: '',
        expectedExitCode: 1
    },
    {
        name: 'Wait for promise',
        child: './wait-for-promise',
        expectedOutput: 'okok',
        expectedExitCode: 0
    },
    {
        name: 'Uncaught Error',
        child: './uncaught-error',
        expectedOutput: 'ok',
        expectedExitCode: 1
    },
    {
        name: 'Uncaught Error - Disabled',
        child: './uncaught-error-disabled',
        expectedOutput: '',
        expectedExitCode: 0
    },
    {
        name: 'Uncaught Error - Toggled',
        child: './uncaught-error-toggled',
        expectedOutput: '',
        expectedExitCode: 0
    },
    {
        name: 'Unhandled Rejection',
        child: './unhandled-rejection',
        expectedOutput: 'ok',
        expectedExitCode: 1
    },
    {
        name: 'Unhandled Rejection - Disabled',
        child: './unhandled-rejection-disabled',
        expectedOutput: '',
        expectedExitCode: 0
    },
    {
        name: 'Unhandled Rejection - Toggled',
        child: './unhandled-rejection-toggled',
        expectedOutput: '',
        expectedExitCode: 0
    },
    {
        name: 'Multiple Errors',
        child: './multiple-errors',
        expectedOutput: 'error',
        expectedExitCode: 1
    }
];

let total = tests.length;
let count = 0;
let success = 0;

function asyncRunner() {
    let test = tests.shift();
    if (!test) {
        if (success < total) {
            console.log(`Has ${total - success} errors!`);
            process.exit(1);
        } else {
            console.log('Success!');
            process.exit(0);
        }
    }

    count++;

    let path = require.resolve(__dirname + '/' + test.child);
    let timer;
    let ended = false;
    // unhandled rejections default to throw since v15, warn since v10
    // we make it the same for all versions so the result will be consistent.
    let child = execFile('node', ["--unhandled-rejections=none", path], (err, stdout) => {
        clearTimeout(timer);
        ended = true;
        if (err && /Error/.test(err.message)) {
            console.error(`[${count}/${total}] [ERROR] ${test.name}: Failed with error\n`,
                err.message,
                '\n---------------------------------------------------'
            );
        } else if (stdout !== test.expectedOutput) {
            console.error(`[${count}/${total}] [ERROR] ${test.name}: Wrong output. expected '${test.expectedOutput}' got '${stdout
            || ''}'`);
        } else if (child.exitCode !== test.expectedExitCode) {
            console.error(`[${count}/${total}] [ERROR] ${test.name}: Wrong exit code. expected ${test.expectedExitCode} got ${child.exitCode}`);
        } else {
            success++;
            console.log(`[${count}/${total}] [OK] ${test.name}`);
        }

        asyncRunner();
    });

    if (test.signal) {
        setTimeout(() => {
            if (ended) return;
            process.kill(child.pid, test.signal);
        }, 500);
    }

    timer = setTimeout(() => {
        throw new Error('Test took too long');
    }, 5000);
}

asyncRunner();
