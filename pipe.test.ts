import { describe, it, expect, mock } from "bun:test";
import { Pipe } from "./pipe";

describe("Pipe", () => {
    it("should create a new Pipe with initial value", () => {
        const pipe = Pipe(5);
        expect(pipe.exec()).toEqual(5);
    });

    describe("to", () => {
        it("should add a function to the pipe and change the value", () => {
            const pipe = Pipe(5).to((x) => x * 2);
            expect(pipe.exec()).toBe(10);
        });

        it("should chain multiple functions", () => {
            const pipe = Pipe(5)
                .to((x) => x * 2)
                .to((x) => x + 3);
            expect(pipe.exec()).toBe(13);
        });
    });

    describe("tap", () => {
        it("should add a function to the pipe without changing the value", () => {
            const pipe = Pipe(5).tap((x) => x * 2);
            expect(pipe.exec()).toBe(5);
        });

        it("should chain with to function", () => {
            const pipe = Pipe(5)
                .to((x) => x * 2)
                .tap((x) => x + 3);
            expect(pipe.exec()).toBe(10);
        });
    });

    describe("exec", () => {
        it("should execute all functions in the pipe and return the final value", () => {
            const pipe = Pipe(5)
                .to((x) => x * 2)
                .tap((x) => x + 3)
                .to((x) => x - 1);
            expect(pipe.exec()).toBe(9);
        });
    });

    describe("catch", () => {
        it("should catch errors in the pipe and return the final value", () => {
            let tapped = false;
            const pipe = Pipe(5)
                .to((x) => x * 2)
                .tap((x) => {
                    tapped = true;
                })
                .to((x) => x - 1)
                .exec();
            expect(tapped).toBe(true);
            expect(pipe).toBe(9);
        });

        it("should catch errors in the pipe and return the catch value", () => {
            let bad = false;
            const pipe = Pipe(5)
                .to((x) => x * 2)
                .catch(() => 0)
                .to((x) => {
                    if (x === 10) throw new Error("simulated error");
                    bad = true;
                    return x - 1;
                })
                .catch(() => 1);
            expect(bad).toBe(false);
            expect(pipe.exec()).toBe(1);
        });
    });

    describe("built-in methods", () => {
        it("should correctly convert to JSON", () => {
            const pipe = Pipe(5).to((x) => x * 2);
            expect(JSON.stringify(pipe)).toBe("10");
            const pipe2 = Pipe({ a: 1 }).to((x) => x);
            expect(JSON.stringify(pipe2)).toBe('{"a":1}');
        });
        it("should correctly convert to number", () => {
            const pipe = Pipe(5).to((x) => x * 2);
            expect(+pipe).toBe(10);
            const pipe2 = Pipe({ a: 1 }).to((x) => x);
            expect(+pipe2).toBeNaN();
        });
        it("should correctly convert to string", () => {
            const pipe = Pipe(5).to((x) => x * 2);
            expect(`${pipe}`).toBe("10");
            const pipe2 = Pipe({ a: 1 }).to((x) => x);
            expect(`${pipe2}`).toBe("[object Object]");
        });
        it("should correctly convert to boolean", () => {
            const pipe = Pipe(5).to((x) => x * 2);
            expect(!pipe).toBe(false);
            const pipe2 = Pipe({ a: 1 }).to((x) => x);
            expect(!!pipe2).toBe(true);
        });
        it("should correctly convert to bigint", () => {
            const pipe = Pipe(5).to((x) => x * 2);
            expect(BigInt(pipe)).toBe(BigInt(10));
            const pipe2 = Pipe({ a: 1 }).to((x) => x);
            // @ts-expect-error
            expect(() => BigInt(pipe2)).toThrow();
        });
        it("should correctly convert to primitive", () => {
            const pipe = Pipe(5).to((x) => x * 2);
            expect(+pipe).toBe(10);
            expect(`${pipe}`).toBe("10");
            const pipe2 = Pipe({ a: 1 }).to((x) => x);
            expect(`${pipe2}`).toBe("[object Object]");
        });
        it("should correctly convert to object", () => {
            const pipe = Pipe(5).to((x) => x * 2);
            // @ts-expect-error - "Spread types may only be created from object types"
            expect({ ...pipe }).toEqual({ value: 10 });
            const pipe2 = Pipe({ a: 1 }).to((x) => x);
            // @ts-expect-error - literal object won't have all the properties
            expect({ ...pipe2 }).toEqual({ value: { a: 1 } });
            const pipe3 = Pipe([1]).to((x) => x);
            expect([...pipe3, 2]).toEqual([1, 2]);
        });
        it("should allow inspecting in node-like environments", () => {
            const pipe = Pipe(5).to((x) => x * 2);
            expect((pipe as any)[Symbol.for("nodejs.util.inspect.custom")]()).toBe("Pipe(10)");
        });
    });

    describe("async", () => {
        it("should correctly handle async functions", async () => {
            const pipe = Pipe(5)
                .to(async (x) => x * 2)
                .to(async (x) => (await x) + 3);
            expect(await pipe.exec()).toBe(13);
        });

        it("should correctly handle async functions with tap", async () => {
            const fn1 = mock((x) => x);
            const fn2 = mock(async (x) => (await x) - 1);
            const val = await Pipe(5)
                .to(async (x) => x * 2)
                .tap(async (x) => {
                    fn1((await x) + 3);
                })
                .to(fn2)
                .exec();
            expect(fn1).toHaveBeenCalledWith(13);
            expect(fn2).toHaveBeenCalledWith(Promise.resolve(10));
            expect(val).toBe(9);
        });

        it("should correctly handle async functions with catch", async () => {
            let bad = false;
            const val = await Pipe(5)
                .to(async (x) => x * 2)
                .to(async (x) => {
                    if ((await x) === 10) throw new Error("simulated error");
                    bad = true;
                    return (await x) - 1;
                })
                .catch(async () => 70)
                .to(async (x) => (await x) - 1)
                .exec();
            expect(val).toBe(69);
        });

        it("should correctly handle async functions with catch and tap", async () => {
            const bad = mock(async (x) => x);
            const fn1 = mock(async (x) => x);
            const fn2 = mock(async (x) => (await x) - 1);
            const val = await Pipe(5)
                .to(async (x) => x * 2)
                .tap(async (x) => {
                    if ((await x) === 10) throw new Error("simulated error");
                    bad(true);
                })
                .catch(fn1)
                .to(fn2)
                .exec();
            expect(bad).not.toHaveBeenCalled();
            expect(fn1).toHaveBeenCalledWith(new Error("simulated error"));
            expect(fn2).toHaveBeenCalledWith(expect.resolvesTo.closeTo(10, 0));
            expect(val).toBe(9);
        });
    });

    it("should be reusable", () => {
        const pipe = Pipe(5)
            .to((x) => x * 2)
            .to((x) => x + 3);
        expect(pipe.exec()).toBe(13);
        expect(pipe.exec()).toBe(13);
        expect(pipe.exec()).toBe(13);
        pipe.to((x) => x - 1);
        expect(pipe.exec()).toBe(12);
        expect(pipe.exec()).toBe(12);
        const fn1 = mock((x) => x);
        const fn2 = mock((x) => x);
        const fn3 = mock((x) => x);
        pipe.to(fn1).to(fn2).to(fn3);
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).not.toHaveBeenCalled();
        expect(fn3).not.toHaveBeenCalled();
        expect(pipe.exec()).toBe(12);
        expect(pipe.exec()).toBe(12);
        expect(pipe.exec()).toBe(12);
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
        expect(fn3).toHaveBeenCalledTimes(1);
        expect(pipe.exec()).toBe(12);
        expect(fn1).toHaveBeenCalledWith(12);
        expect(fn2).toHaveBeenCalledWith(12);
        expect(fn3).toHaveBeenCalledWith(12);
    });

    it("should be practical", () => {
        const pipe1 = Pipe("hello")
            .to((x) => x.toUpperCase())
            .to((x) => x.split(""))
            .to((x) => x.reverse())
            .to((x) => x.join(""))
            .to((x) => x + "!")
            .to((x) => x.repeat(3))
            .to((x) => x.split("!"))
            .to((x) => x.join(" "))
            .to((x) => x.trim())
            .exec();
        expect(pipe1).toBe("OLLEH OLLEH OLLEH");

        const fn1 = mock((x) => x);
        const fn2 = mock((x) => x);
        const fn3 = mock((x) => x);
        const pipe2 = Pipe(69)
            .to(String)
            .to((x) => x.split(""))
            .tap(fn1)
            .to((x) => x.map((y) => +y))
            .to((x) => x.reduce((a, b) => a + b))
            .tap(fn2)
            .to((x) => x ** 2)
            .tap(fn3)
            .to((x) => x.toString(16))
            .to((x) => x.toUpperCase())
            .to((x) => x.padStart(4, "0"))
            .exec();
        expect(fn1).toHaveBeenCalledWith(["6", "9"]);
        expect(fn2).toHaveBeenCalledWith(15);
        expect(fn3).toHaveBeenCalledWith(225);
        expect(pipe2).toBe("00E1");
    });
});
