import { describe, expect, test, beforeEach } from "bun:test";
import Queue from "./fifo-queue";

describe("FIFO Queue", () => {
    let queue: Queue<any>;

    beforeEach(() => {
        queue = new Queue();
    });

    test("should initialize an empty queue", () => {
        expect(queue.size()).toBe(0);
        expect(queue.isEmpty()).toBe(true);
    });

    test("should enqueue items to the queue", () => {
        queue.enqueue(1);
        expect(queue.size()).toBe(1);
        expect(queue.isEmpty()).toBe(false);

        queue.enqueue(2);
        expect(queue.size()).toBe(2);
    });

    test("should dequeue items from the queue", () => {
        queue.enqueue(1);
        queue.enqueue(2);

        expect(queue.dequeue()).toBe(1);
        expect(queue.size()).toBe(1);

        expect(queue.dequeue()).toBe(2);
        expect(queue.size()).toBe(0);
        expect(queue.isEmpty()).toBe(true);
    });

    test("should return undefined when dequeueing an empty queue", () => {
        expect(queue.dequeue()).toBeUndefined();
    });

    test("should peek the front item in the queue", () => {
        const queue1 = new Queue<number>();
        queue1.enqueue(1);
        queue1.enqueue(2);

        expect(queue1.peekFront()).toBe(1);
        expect(queue1.size()).toBe(2);

        const queue2 = new Queue<number>();
        queue2.enqueue(1);
        expect(queue2.peekFront()).toBe(1);

        const queue3 = new Queue<number>();
        expect(queue3.peekFront()).toBeUndefined();
    });

    test("should peek the back item in the queue", () => {
        const queue = new Queue<number>();
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        expect(queue.peekBack()).toBe(3);
        expect(queue.size()).toBe(3);

        const queue2 = new Queue<number>();
        queue2.enqueue(1);
        expect(queue2.peekBack()).toBe(1);

        const queue3 = new Queue<number>();
        expect(queue3.peekBack()).toBeUndefined();
    });

    test("should peek front and back of the queue", () => {
        const queue = new Queue<number>();
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        expect(queue.peekFront()).toBe(1);
        expect(queue.peekBack()).toBe(3);
        expect(queue.size()).toBe(3);

        const queue2 = new Queue<number>();
        queue2.enqueue(1);
        expect(queue2.peekFront()).toBe(1);
        expect(queue2.peekBack()).toBe(1);

        const queue3 = new Queue<number>();
        expect(queue3.peekFront()).toBeUndefined();
        expect(queue3.peekBack()).toBeUndefined();
    });

    test("should handle large data sets", () => {
        const num = 100_000;
        for (let i = 0; i < num; i++) {
            queue.enqueue(i);
        }

        expect(queue.size()).toBe(num);

        for (let i = 0; i < num; i++) {
            expect(queue.dequeue()).toBe(i);
        }

        expect(queue.isEmpty()).toBe(true);
    });

    test("should handle different types of data", () => {
        queue = new Queue();
        const obj = { a: 1, b: 2 };
        const str = "test";
        const undef = undefined;
        const nil = null;

        queue.enqueue(obj);
        queue.enqueue(str);
        queue.enqueue(undef);
        queue.enqueue(nil);

        expect(queue.dequeue()).toBe(obj);
        expect(queue.dequeue()).toBe(str);
        expect(queue.dequeue()).toBe(undef);
        expect(queue.dequeue()).toBe(nil);
        expect(queue.dequeue()).toBe(undefined);
    });

    test("should correctly iterate over the queue using for...of", () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);

        let i = 1;
        for (const item of queue) {
            expect(item).toBe(i++);
        }

        // After iterating, the queue should still be the same
        expect(queue.size()).toBe(3);
        expect(queue.isEmpty()).toBe(false);

        const queue2 = new Queue<number>();
        queue2.enqueue(1);
        queue2.enqueue(2);
        queue2.enqueue(3);

        let i2 = 0;
        for (const item of queue2.drain()) {
            expect(item).toBe(++i2);
        }

        // After iterating, the queue should be empty
        expect(queue2.size()).toBe(0);
        expect(queue2.isEmpty()).toBe(true);
    });
});
