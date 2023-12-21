import test from 'node:test'
import assert from 'node:assert'
import {
    atom,
    lastAction,
    action,
    allTasks,
    onNotify,
    atomMap
} from '../index.mjs'

const delay = (ms, value) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms, value)
    })

test('shows action name', () => {
    let events = []
    let $store = atom(0)

    onNotify($store, () => {
        events.push($store[lastAction])
    })

    let setProp = action($store, 'setProp', (s, num) => {
        s.set(num)
    })

    setProp(1)
    setProp(2)
    setProp(3)
    assert.deepEqual($store.get(), 3)

    assert.deepEqual(events, ['setProp', 'setProp', 'setProp'])
})

test('shows action name for maps', () => {
    let events = []
    let $store = atomMap({ sum: 0 })

    onNotify($store, () => {
        events.push($store[lastAction])
    })

    let setProp = action($store, 'setSum', (s, num) => {
        s.setKey('sum', num)
    })

    setProp(1)
    setProp(2)
    setProp(3)
    assert.deepEqual($store.get(), { sum: 3 })

    assert.deepEqual(events, ['setSum', 'setSum', 'setSum'])
})

test('supports async tasks', async () => {
    let $counter = atom(0)
    let events = []

    onNotify($counter, () => {
        events.push($counter[lastAction])
    })

    let increaseWithDelay = action($counter, 'increaseWithDelay', async (s) => {
        await delay(10)
        s.set(s.get() + 1)
        return 'result'
    })

    increaseWithDelay()
    assert.deepEqual($counter.get(), 0)
    await allTasks()
    assert.deepEqual($counter.get(), 1)

    assert.deepEqual(await increaseWithDelay(), 'result')
    assert.deepEqual($counter.get(), 2)

    $counter.set(3)

    assert.deepEqual(events, [
        'increaseWithDelay',
        'increaseWithDelay',
        undefined
    ])
})

test('track previous actionName correctly', () => {
    let events = []
    let $store = atom(0)

    onNotify($store, () => {
        events.push($store[lastAction])
    })

    let setProp = action($store, 'setProp', (s, num) => {
        s.set(num)
    })

    setProp(1)
    $store.set(2)
    setProp(3)

    assert.deepEqual(events, ['setProp', undefined, 'setProp'])
})

test('allows null', () => {
    let $store = atom({ a: 1 })

    let setNull = action($store, 'setNull', (s) => {
        s.set(null)
    })
    setNull()

    assert.deepEqual($store.get(), null)
})
