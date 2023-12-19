import { ListenerQueue } from './listenerQueue.mjs'

import { before, after, describe, it } from 'node:test'
import assert from 'node:assert'

describe('listener queue', () => {
    it('can be initialized', () => {
        const q = new ListenerQueue()
        assert.equal(q.isEmpty(), true)
    })

    it('can add item and empty queue', () => {
        const q = new ListenerQueue()
        q.add({
            listener: () => {},
            level: 0,
            value: 123
        })
        q.add({
            listener: () => {},
            level: 0,
            value: 123
        })

        assert.equal(q.isEmpty(), false)
        q.empty()
        assert.equal(q.isEmpty(), true)
    })

    it('can emit listener functions', () => {
        const q = new ListenerQueue()
        let calls = []
        q.add({
            listener: () => {
                calls.push(1)
            },
            level: 0,
            value: 123
        })
        q.add({
            listener: () => {
                calls.push(2)
            },
            level: 1,
            value: 123
        })
        q.emit()

        assert.deepEqual(calls, [1, 2])
    })

    it('can emit will always emit listeners from lowest to highest level in that order', () => {
        const q = new ListenerQueue()
        let calls = []
        q.add({
            listener: (x) => calls.push(x),
            level: 0,
            value: 'A'
        })
        q.add({
            listener: (x) => calls.push(x),
            level: 3,
            value: 'B'
        })
        q.add({
            listener: (x) => calls.push(x),
            level: 2,
            value: 'C'
        })
        q.emit()

        assert.deepEqual(calls, ['A', 'C', 'B'])
        // The sorting is accomplished by pushing a duplicate of the higher level to the end
        // of the array, and starting the loop from one inex up
        const queueState = q.queue.map((x) => x.value)
        assert.deepEqual(queueState, ['A', 'B', 'C', 'B'])
    })
    it('can emit will always emit listeners from lowest to highest level in that order 2', () => {
        const q = new ListenerQueue()
        let calls = []
        q.add({
            listener: (x) => calls.push(x),
            level: 3,
            value: 'A'
        })
        q.add({
            listener: (x) => calls.push(x),
            level: 2,
            value: 'B'
        })
        q.add({
            listener: (x) => calls.push(x),
            level: 1,
            value: 'C'
        })
        q.emit()

        assert.deepEqual(calls, ['C', 'B', 'A'])
        // The sorting is accomplished by pushing a duplicate of the higher level to the end
        // of the array, and starting the loop from one inex up
        const queueState = q.queue.map((x) => x.value)
        assert.deepEqual(queueState, ['A', 'B', 'C', 'A', 'B', 'A'])
    })
})
