export default class Queue<T> {
    private inStack: T[];
    private outStack: T[];

    constructor() {
        this.inStack = [];
        this.outStack = [];
    }

    enqueue(item: T): void {
        this.inStack.push(item);
    }

    dequeue(): T | undefined {
        if (this.outStack.length === 0) {
            while (this.inStack.length > 0) {
                this.outStack.push(this.inStack.pop() as T);
            }
        }
        return this.outStack.pop();
    }

    size(): number {
        return this.inStack.length + this.outStack.length;
    }

    isEmpty(): boolean {
        return this.size() === 0;
    }

    peekLast(): T | undefined {
        return this.inStack[this.inStack.length - 1];
    }

    *[Symbol.iterator](): IterableIterator<T> {
        while (this.size() > 0) {
            yield this.dequeue() as T;
        }
    }
}
