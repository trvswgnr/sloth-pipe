export default class Queue<T> {
    private in: T[];
    private out: T[];

    constructor() {
        this.in = [];
        this.out = [];
    }

    enqueue(item: T): void {
        this.in.push(item);
    }

    dequeue(): T | undefined {
        if (this.out.length === 0) {
            while (this.in.length > 0) {
                this.out.push(this.in.pop() as T);
            }
        }
        return this.out.pop();
    }

    size(): number {
        return this.in.length + this.out.length;
    }

    isEmpty(): boolean {
        return this.size() === 0;
    }

    peekBack(): T | undefined {
        return this.in[this.in.length - 1];
    }

    peekFront(): T | undefined {
        if (this.out.length === 0) {
            return this.in[0];
        }
        return this.out[this.out.length - 1];
    }

    *[Symbol.iterator](): IterableIterator<T> {
        while (this.size() > 0) {
            yield this.dequeue() as T;
        }
    }
}
