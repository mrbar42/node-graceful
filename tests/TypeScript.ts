import Graceful from "../";

const listener = (signal: string, event?: object) => void 0;
const listenerPromise = (signal: string, event?: object) => Promise.resolve("abc");
const listenerPromise1 = (signal: string, event?: object) => Promise.resolve({});
const listenerPromise2 = (signal: string, event?: object) => new Promise<void>((resolve) => resolve());
const listenerPromise3 = (signal: string, event?: object) => new Promise<void>((resolve) => resolve());
const listenerPromise4 = () => null;

Graceful.on("exit", listener);
Graceful.on("exit", listenerPromise);
Graceful.on("exit", listenerPromise1);
Graceful.on("exit", listenerPromise2);
Graceful.on("exit", listenerPromise3);
Graceful.on("exit", listenerPromise4);

Graceful.off("exit", listener);

Graceful.clear();

Graceful.exit();
Graceful.exit(1);
Graceful.exit(0, "SIGTERM");
Graceful.exit("SIGTERM");

Graceful.exitOnDouble = true;
Graceful.timeout = 30000;
Graceful.captureExceptions = true;
Graceful.captureRejections = true;

const indirectRef: typeof Graceful = Graceful;
indirectRef.on("exit", listener);
