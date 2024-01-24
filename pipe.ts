import Queue from "./fifo-queue";
export const NODE_INSPECT = Symbol.for("nodejs.util.inspect.custom");
type QueueItem<T> = {
    fn?: PipedFn<T, "to">;
    args: any[];
    tap: boolean;
    catchFn?: PipedFn<T, "to">;
};
export type Pipe<T, U, M extends PipeMethod<T>> = U extends Promise<any>
    ? PipeMethodReturn<T, U, M>
    : PipeMethodReturn<T, U, M> & T;
export const Pipe = (<const T>(_value: T) => {
    let value = _value as any;
    const fns: Queue<QueueItem<T>> = new Queue();
    const exec = (): unknown => {
        for (const { fn, args, tap, catchFn } of fns) {
            if (!fn) continue;
            if (tap) {
                if (catchFn) {
                    try {
                        if (fn.constructor.name === "AsyncFunction") {
                            fn(value, ...args).catch(catchFn);
                            continue;
                        }
                        fn(value, ...args);
                    } catch (err) {
                        catchFn(err as any);
                    }
                    continue;
                }
                fn(value, ...args);
                continue;
            }
            if (catchFn) {
                try {
                    if (fn.constructor.name === "AsyncFunction") {
                        value = fn(value, ...args).catch(catchFn);
                        continue;
                    }
                    value = fn(value, ...args);
                } catch (err) {
                    value = catchFn(err as any);
                }
                continue;
            }
            value = fn(value, ...args);
        }
        return value;
    };
    const catchable = {
        catch: (fn: (err: unknown) => any) => {
            const item = fns.peekBack();
            if (!item) return ret;
            item.catchFn = fn as any;
            return ret;
        },
    };
    const to = (fn?: (x?: any, ...args: any[]) => any, ...args: any[]) => {
        fns.enqueue({ fn, args, tap: false });
        const obj = Object.assign(ret);
        definePrivateProperty(obj, "catch", catchable.catch);
        return obj;
    };
    const tap = <U extends PipedFn<T, "tap">>(fn: (x?: T, ...args: any[]) => U, ...args: any[]) => {
        fns.enqueue({ fn: fn as any, args, tap: true });
        const obj = Object.assign(ret);
        definePrivateProperty(obj, "catch", catchable.catch);
        return obj;
    };
    const ret = {};
    definePrivateProperties(ret, {
        /**
         * takes a function and arguments and adds it to the pipe.
         * when the pipe is executed, the function will be called with the value, setting the value to the result.
         * @returns the pipe to be chained
         */
        to,
        _: to,
        /**
         * takes a function and arguments and adds it to the pipe.
         * when the pipe is executed, the function will be called with the value, but the value will not be changed.
         * @returns the pipe to be chained
         */
        tap,
        exec,
    });
    // internals
    Object.defineProperty(ret, "value", {
        get() {
            return exec();
        },
        enumerable: true,
        configurable: false,
    });
    definePrivateProperties(ret, {
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
                // @ts-expect-error this is fine, we checked for it
                return val[Symbol.iterator]();
            }
            return {
                next() {
                    return { done: true, value: val };
                },
            };
        },
        [NODE_INSPECT]: () => `Pipe(${exec()})`,
    });
    return Object.create(ret);
}) as <const T>(x: T) => Pipeable<T>;

/**
 * creates a property that's non-enumerable, non-writable, and non-configurable
 * @param x the object to define the property on
 * @param key the key of the property
 * @param value the value of the property
 * @returns the object passed in
 * @example
 * ```ts
 * const obj = {};
 * definePrivateProperty(obj, "a", 1);
 * console.log(obj.a); // 1
 * console.log(Object.keys(obj)); // []
 * ```
 */
function definePrivateProperty<X, T>(x: X, key: PropertyKey, value: T) {
    return Object.defineProperty(x, key, {
        value,
        enumerable: false,
        writable: false,
        configurable: false,
    });
}

/**
 * creates properties that are non-enumerable, non-writable, and non-configurable
 * @param x the object to define the properties on
 * @param props the properties to define
 * @returns the object passed in
 * @example
 * ```ts
 * const obj = {};
 * definePrivateProperties(obj, { a: 1, b: 2 });
 * console.log(obj.a); // 1
 * console.log(obj.b); // 2
 * console.log(Object.keys(obj)); // []
 * ```
 */
function definePrivateProperties<X>(x: X, props: Record<PropertyKey, any>) {
    const entries = Object.entries(props);
    const symbols = Object.getOwnPropertySymbols(props).map((symbol) => [symbol, props[symbol]]);
    const entriesAndSymbols = [...entries, ...symbols];
    for (const [key, value] of entriesAndSymbols) {
        definePrivateProperty(x, key, value);
    }
    return x;
}

const Mask = Symbol("mask");
type Mask<T> = T & { [Mask]?: true };
type PipeMethod<T> = Mask<keyof Pipeable<T>>;
type Catchable<T> = { catch: <V>(fn: (err: unknown) => V) => Pipe<T, V | T, "to"> };
type CatchableTap<T> = { catch: <V>(fn: (err: unknown) => V) => Pipe<T, T, "to"> };
type PipeMethodReturn<T, U, M> = M extends "to"
    ? Pipeable<U> & Catchable<U>
    : M extends "tap"
    ? Pipeable<T> & CatchableTap<T>
    : M extends "catch"
    ? Pipeable<U>
    : M extends "exec"
    ? U
    : never;

// prettier-ignore
type PipedFn<T, M extends PipeMethod<T>> = {
    <U>(fn: (x: T) => U): Pipe<T, U, M>;
    <U, A>(fn: (x: T, a: A) => U, a: A): Pipe<T, U, M>;
    <U, A, B>(fn: (x: T, a: A, b: B) => U, a: A, b: B): Pipe<T, U, M>;
    <U, A, B, C>(fn: (x: T, a: A, b: B, c: C) => U, a: A, b: B, c: C): Pipe<T, U, M>;
    <U, A, B, C, D>(fn: (x: T, a: A, b: B, c: C, d: D) => U, a: A, b: B, c: C, d: D): Pipe<T, U, M>;
    <U, A, B, C, D, E>(fn: (x: T, a: A, b: B, c: C, d: D, e: E) => U, a: A, b: B, c: C, d: D, e: E): Pipe<T, U, M>;
    <U, A, B, C, D, E, F>(fn: (x: T, a: A, b: B, c: C, d: D, e: E, f: F) => U, a: A, b: B, c: C, d: D, e: E, f: F): Pipe<T, U, M>;
    <U, A, B, C, D, E, F, G>(fn: (x: T, a: A, b: B, c: C, d: D, e: E, f: F, g: G) => U, a: A, b: B, c: C, d: D, e: E, f: F, g: G): Pipe<T, U, M>;
    <U, A, B, C, D, E, F, G, H>(fn: (x: T, a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H) => U, a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H): Pipe<T, U, M>;
    <U, A, B, C, D, E, F, G, H, I>(fn: (x: T, a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I) => U, a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I): Pipe<T, U, M>;
    <U, A, B, C, D, E, F, G, H, I, J>(fn: (x: T, a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J) => U, a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J): Pipe<T, U, M>;
    <U>(fn: (x: T, ...args: unknown[]) => U, ...args: unknown[]): Pipe<T, U, M>;
    <U>(fn: () => U): Pipe<T, U, M>;
    (): Pipe<T, T, M>;
};

interface Pipeable<T> {
    value: T;
    _: PipedFn<T, "to">;
    to: PipedFn<T, "to">;
    tap: PipedFn<T, "tap">;
    exec: PipedFn<T, "exec">;
    [NODE_INSPECT]: () => string;
    [Symbol.toStringTag]: "Pipe";
    [Symbol.toPrimitive]: (hint: "string" | "number" | "default") => string | number;
    [Symbol.iterator]: () => Iterator<T>;
    toString: Pipeable<T>["exec"];
    valueOf: Pipeable<T>["exec"];
    toJSON: Pipeable<T>["exec"];
}
