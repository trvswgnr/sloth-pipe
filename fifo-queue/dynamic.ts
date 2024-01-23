export default class Queue<T> {
    private buffer: (T | undefined)[];
    private head: number;
    private tail: number;
    private capacity: number;

    constructor(initialCapacity: number = 2) {
        this.buffer = new Array(initialCapacity);
        this.head = 0;
        this.tail = 0;
        this.capacity = initialCapacity;
    }

    enqueue(item: T): void {
        if (this.size() === this.capacity) {
            this.doubleCapacity();
        }
        this.buffer[this.tail] = item;
        this.tail = (this.tail + 1) % this.capacity;
    }

    dequeue(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }
        const item = this.buffer[this.head];
        this.buffer[this.head] = undefined; // clear reference to allow garbage collection
        this.head = (this.head + 1) % this.capacity;
        return item;
    }

    size(): number {
        return this.tail >= this.head
            ? this.tail - this.head
            : this.capacity - this.head + this.tail;
    }

    isEmpty(): boolean {
        return this.head === this.tail;
    }

    private doubleCapacity(): void {
        const newCapacity = this.capacity * 2;
        const newBuffer = new Array(newCapacity);
        for (let i = 0; i < this.capacity; i++) {
            newBuffer[i] = this.buffer[(this.head + i) % this.capacity];
        }
        this.buffer = newBuffer;
        this.head = 0;
        this.tail = this.capacity;
        this.capacity = newCapacity;
    }
}
