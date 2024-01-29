import Queue from "./fifo-queue";

const NODE_INSPECT = Symbol.for("nodejs.util.inspect.custom");

export const Pipe = <const T>(value: T): Pipeable<T> => {
    const fns = new Queue<QueueItem<T>>();
    const exec = (): unknown => {
        for (const { fn, args, tap, catchFn } of fns.drain()) {
            if (!fn) continue;
            if (tap) {
                if (catchFn) {
                    tryCatch(fn, value, args, catchFn);
                    continue;
                }
                fn(value, ...args);
                continue;
            }
            if (catchFn) {
                value = tryCatch(fn, value, args, catchFn);
                continue;
            }
            value = fn(value, ...args);
        }
        return value;
    };
    const enqueue = (tap: boolean) => {
        return (fn: (x?: any, ...args: any[]) => any, ...args: any[]) => {
            fns.enqueue({ fn, args, tap });
            return ret;
        };
    };
    const ret = {
        get value() {
            return exec();
        },
        to: enqueue(false),
        _: enqueue(false),
        tap: enqueue(true),
        catch: (fn: (err: unknown) => any) => {
            const item = fns.peekBack();
            if (!item) return ret;
            item.catchFn = fn as any;
            return ret;
        },
        exec,
        valueOf: exec,
        toJSON: exec,
        toString: () => String(exec()),
        [Symbol.toStringTag]: "Pipe",
        [Symbol.toPrimitive]: (hint: unknown) => {
            return hint === "string" ? String(exec()) : Number(exec());
        },
        [Symbol.iterator]: (): Iterator<T> => {
            const val = exec();
            if (typeof val === "object" && val !== null && Symbol.iterator in val) {
                const iter = val[Symbol.iterator];
                if (typeof iter === "function") {
                    return iter();
                }
            }
            return {
                next() {
                    return { done: true, value: val };
                },
            };
        },
        [NODE_INSPECT]: () => `Pipe(${exec()})`,
    };
    return ret as unknown as Pipeable<T>;
};

function tryCatch(
    fn: (...args: any[]) => any,
    value: any,
    args: any[],
    catchFn: (err: unknown) => any,
) {
    try {
        if (fn.constructor.name === "AsyncFunction") {
            return fn(value, ...args).catch(catchFn);
        }
        return fn(value, ...args);
    } catch (err) {
        return catchFn(err as any);
    }
}

type QueueItem<T> = {
    fn?: (x: T, ...args: any[]) => any;
    args: any[];
    tap: boolean;
    catchFn?: (err: unknown) => Pipeable<unknown> & Catchable<unknown> & T;
};

export type Pipe<T, U, M extends keyof Pipeable<T>> = U extends Promise<any>
    ? PipeMethodReturn<T, U, M>
    : PipeMethodReturn<T, U, M> & T;

type Catchable<T> = { catch: <V>(fn: (err: unknown) => V) => Pipe<T, V | T, "to"> };
type CatchableTap<T> = { catch: <V>(fn: (err: unknown) => V) => Pipe<T, T, "to"> };
type PipeMethodReturn<T, U, M> = M extends "to"
    ? Pipeable<U> & Catchable<U>
    : M extends "tap"
    ? Pipeable<T> & CatchableTap<T>
    : M extends "catch"
    ? Pipeable<U>
    : never;

type PipedFnTo<T> = {
    /**
     * takes a function and arguments and adds it to the pipe.
     * when the pipe is executed, the function will be called with the value, setting the value to the result.
     * @param fn the function to be called with the value
     * @param args additional arguments to be passed to the function, if any
     * @returns the pipe for further chaining
     */
    <U, const A extends readonly any[]>(fn: (x: T, ...args: A) => U, ...args: A): Pipe<T, U, "to">;
    <U>(fn: (x: T) => U): Pipe<T, U, "to">;
    <U>(fn: () => U): Pipe<T, U, "to">;
};

type PipedFnTap<T> = {
    /**
     * takes a function and arguments and adds it to the pipe.
     * when the pipe is executed, the function will be called with the value, but the value will not be changed.
     * @param fn the function to be called with the value
     * @param args additional arguments to be passed to the function, if any
     * @returns the pipe for further chaining
     */
    <U, const A extends readonly any[]>(fn: (x: T, ...args: A) => U, ...args: A): Pipe<T, U, "tap">;
    <U>(fn: (x: T) => U): Pipe<T, U, "tap">;
    <U>(fn: () => U): Pipe<T, U, "tap">;
};

interface Pipeable<T> {
    /**
     * the result of the pipe after it's been executed.
     * if the pipe has not been executed, it wil execute it and return the result
     */
    value: T;
    _: PipedFnTo<T>;
    to: PipedFnTo<T>;
    tap: PipedFnTap<T>;
    /** executes the pipe and returns the result */
    exec: () => T;
    // internals
    [NODE_INSPECT]: () => string;
    [Symbol.toStringTag]: "Pipe";
    [Symbol.toPrimitive]: (hint: "string" | "number" | "default") => string | number;
    [Symbol.iterator]: () => Iterator<T>;
    toString: Pipeable<T>["exec"];
    valueOf: Pipeable<T>["exec"];
    toJSON: Pipeable<T>["exec"];
}
