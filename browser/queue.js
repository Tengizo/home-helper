class Queue {
    constructor() {
        this.dequeues = {};
        this.dequeueHead = 0;
        this.dequeueTail = 0;
        this.elements = {};
        this.head = 0;
        this.tail = 0;
    }

    enqueue(element) {
        this.elements[this.tail] = element;
        this.tail++;
        if (this.dequeueLength > 0) {
            const dequeue = this.dequeues[this.dequeueHead];
            this.dequeueHead++;
            dequeue.resolve(this.dequeue());
        }
    }

    dequeue() {
        const item = this.elements[this.head];
        delete this.elements[this.head];
        this.head++;
        return item;
    }

    dequeueAsync() { //will dequeue when an item is available
        if (this.isEmpty) {
            return new Promise((resolve, reject) => {
                this.dequeues[this.dequeueTail] = {resolve, reject};
                this.dequeueTail++;
            });
        }
        return Promise.resolve(this.dequeue());
    }

    peek() {
        return this.elements[this.head];
    }

    get length() {
        return this.tail - this.head;
    }

    get dequeueLength() {
        return this.dequeueTail - this.dequeueHead;
    }

    get isEmpty() {
        return this.length === 0;
    }
}

module.exports = Queue;