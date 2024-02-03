export default class FifoQueue<T> implements Queue<T> {
    constructor(private queue: (T | undefined)[] = [], private front: number = 0) {}

    enqueue(item: T): void {
        this.queue.push(item);
    }

    dequeue(): T | undefined {
        if (this.empty()) return undefined;
        const item = this.queue[this.front];
        this.queue[this.front] = undefined; // allow garbage collection
        this.front++;
        return item;
    }

    empty(): boolean {
        return this.front >= this.queue.length;
    }

    size(): number {
        return this.queue.length - this.front;
    }

    get length(): number {
        return this.size();
    }

    peekFront(): T | undefined {
        return this.queue[this.front];
    }

    peekBack(): T | undefined {
        return this.queue[this.queue.length - 1];
    }

    *drain(): IterableIterator<T> {
        while (!this.empty()) {
            yield this.dequeue()!;
        }
    }

    *[Symbol.iterator](): Iterator<T> {
        for (let i = this.front; i < this.queue.length; i++) {
            yield this.queue[i]!;
        }
    }
}

interface Queue<T> {
    /** adds an item to the queue */
    enqueue(item: T): void;
    /** removes an item from the queue */
    dequeue(): T | undefined;
    /** returns the size of the queue */
    size(): number;
    /** returns the size of the queue */
    length: number;
    /** checks if the queue is empty */
    empty(): boolean;
    /** gets the last item in the queue, without removing it */
    peekBack(): T | undefined;
    /** gets the first item in the queue, without removing it */
    peekFront(): T | undefined;
    /** returns an iterator over the queue, consuming the queue with each iteration */
    drain(): IterableIterator<T>;
    /** returns an iterator over the queue without consuming it */
    [Symbol.iterator](): Iterator<T>;
}
