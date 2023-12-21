import FakeTimers from '@sinonjs/fake-timers'
import { before, after, describe, it } from 'node:test'
import assert from 'node:assert'
import { atomMap, onMount } from '../index.mjs'

describe('atomMap', () => {
    let clock
    before(() => {
        clock = FakeTimers.install()
    })

    after(() => {
        clock.uninstall()
    })

    it('initializes store when it has listeners', () => {
        let events = []

        let $store = atomMap()

        onMount($store, () => {
            $store.setKey('a', 0)
            $store.setKey('b', 0)
            events.push('init')
            return () => {
                events.push('destroy')
            }
        })

        assert.deepEqual(events, [])

        let unbind1 = $store.listen((value, key) => {
            events.push(`1: ${key} ${JSON.stringify(value)}`)
        })
        assert.deepEqual(events, ['init'])

        let unbind2 = $store.listen((value, key) => {
            events.push(`2: ${key} ${JSON.stringify(value)}`)
        })
        assert.deepEqual(events, ['init'])

        $store.setKey('a', 1)
        assert.deepEqual(events, [
            'init',
            '1: a {"a":1,"b":0}',
            '2: a {"a":1,"b":0}'
        ])

        unbind1()
        clock.runAll()
        assert.deepEqual(events, [
            'init',
            '1: a {"a":1,"b":0}',
            '2: a {"a":1,"b":0}'
        ])

        $store.setKey('b', 1)
        assert.deepEqual(events, [
            'init',
            '1: a {"a":1,"b":0}',
            '2: a {"a":1,"b":0}',
            '2: b {"a":1,"b":1}'
        ])

        unbind2()
        assert.deepEqual(events, [
            'init',
            '1: a {"a":1,"b":0}',
            '2: a {"a":1,"b":0}',
            '2: b {"a":1,"b":1}'
        ])

        let unbind3 = $store.listen(() => {})
        clock.runAll()
        assert.deepEqual(events, [
            'init',
            '1: a {"a":1,"b":0}',
            '2: a {"a":1,"b":0}',
            '2: b {"a":1,"b":1}'
        ])

        unbind3()
        assert.deepEqual(events, [
            'init',
            '1: a {"a":1,"b":0}',
            '2: a {"a":1,"b":0}',
            '2: b {"a":1,"b":1}'
        ])

        clock.runAll()
        assert.deepEqual(events, [
            'init',
            '1: a {"a":1,"b":0}',
            '2: a {"a":1,"b":0}',
            '2: b {"a":1,"b":1}',
            'destroy'
        ])
    })

    it('supports complicated case of last unsubscribing', () => {
        let events = []

        let $store = atomMap()

        onMount($store, () => {
            return () => {
                events.push('destroy')
            }
        })

        let unbind1 = $store.listen(() => {})
        unbind1()

        let unbind2 = $store.listen(() => {})
        unbind2()

        clock.runAll()
        assert.deepEqual(events, ['destroy'])
    })

    it('supports the same listeners', () => {
        let events = []
        function listener(value, key) {
            events.push(`${key}: ${value[key]}`)
        }

        let $store = atomMap()

        onMount($store, () => {
            return () => {
                events.push('destroy')
            }
        })

        let unbind1 = $store.listen(listener)
        let unbind2 = $store.listen(listener)
        $store.setKey('a', 1)
        assert.deepEqual(events, ['a: 1', 'a: 1'])

        unbind1()
        clock.runAll()
        $store.setKey('a', 2)
        assert.deepEqual(events, ['a: 1', 'a: 1', 'a: 2'])

        unbind2()
        clock.runAll()
        assert.deepEqual(events, ['a: 1', 'a: 1', 'a: 2', 'destroy'])
    })

    it('can subscribe to changes and call listener immediately', () => {
        let events = []

        let $store = atomMap()

        onMount($store, () => {
            $store.setKey('a', 0)
            return () => {
                events.push('destroy')
            }
        })

        let unbind = $store.subscribe((value, key) => {
            events.push(`${key}: ${JSON.stringify(value)}`)
        })
        assert.deepEqual(events, ['undefined: {"a":0}'])

        $store.setKey('a', 1)
        assert.deepEqual(events, ['undefined: {"a":0}', 'a: {"a":1}'])

        unbind()
        clock.runAll()
        assert.deepEqual(events, [
            'undefined: {"a":0}',
            'a: {"a":1}',
            'destroy'
        ])
    })

    it('supports starting store again', () => {
        let events = []

        let $store = atomMap()

        onMount($store, () => {
            $store.setKey('a', 0)
            events.push('init')
            return () => {
                events.push('destroy')
            }
        })

        let unbind = $store.subscribe((value) => {
            events.push(`${value.a}`)
        })

        $store.setKey('a', 1)

        unbind()
        clock.runAll()

        $store.set({ a: 2 })
        $store.setKey('a', 3)

        $store.subscribe((value) => {
            events.push(`${value.a}`)
        })
        assert.deepEqual(events, ['init', '0', '1', 'destroy', 'init', '0'])
    })

    it('works without initializer', () => {
        let events = []

        let $store = atomMap()

        let unbind = $store.subscribe((value, key) => {
            events.push(key)
        })
        assert.deepEqual(events, [undefined])

        $store.setKey('a', 1)
        assert.deepEqual(events, [undefined, 'a'])

        unbind()
        clock.runAll()
    })

    it('supports conditional destroy', () => {
        let events = []

        let destroyable = true
        let $store = atomMap()

        onMount($store, () => {
            events.push('init')
            if (destroyable) {
                return () => {
                    events.push('destroy')
                }
            }
        })

        let unbind1 = $store.listen(() => {})
        unbind1()
        clock.runAll()
        assert.deepEqual(events, ['init', 'destroy'])

        destroyable = false
        let unbind2 = $store.listen(() => {})
        unbind2()
        clock.runAll()
        assert.deepEqual(events, ['init', 'destroy', 'init'])
    })

    it('changes the whole object', () => {
        let $store = atomMap()

        onMount($store, () => {
            $store.setKey('a', 0)
            $store.setKey('b', 0)
        })

        let changes = []
        $store.listen((value, key) => {
            changes.push(key)
        })

        $store.set({ a: 1, b: 0, c: 0 })
        assert.deepEqual($store.get(), { a: 1, b: 0, c: 0 })
        assert.deepEqual(changes, [undefined])

        $store.set({ a: 1, b: 1 })
        assert.deepEqual($store.get(), { a: 1, b: 1 })
        assert.deepEqual(changes, [undefined, undefined])
    })

    it('does not call listeners on no changes', () => {
        let $store = atomMap({ one: 1 })

        let changes = []
        $store.listen((value, key) => {
            changes.push(key)
        })

        $store.setKey('one', 1)
        $store.set({ one: 1 })
        assert.deepEqual(changes, [undefined])
    })

    it('changes value object reference', () => {
        let $store = atomMap({ a: 0 })

        let checks = []
        let prev
        $store.subscribe((value) => {
            if (prev) checks.push(value === prev)
            prev = value
        })

        $store.setKey('a', 1)
        $store.set({ a: 2 })
        assert.deepEqual(checks, [false, false])
    })

    it('deletes keys on undefined value', () => {
        let $store = atomMap()

        let keys = []
        $store.listen((value) => {
            keys.push(Object.keys(value))
        })

        $store.setKey('a', 1)
        $store.setKey('a', undefined)
        assert.deepEqual(keys, [['a'], []])
    })

    it('does not mutate listeners while change event', () => {
        let events = []
        let $store = atomMap({ a: 0 })

        $store.listen((value) => {
            events.push(`a${value.a}`)
            unbindB()
            $store.listen((v) => {
                events.push(`c${v.a}`)
            })
        })

        let unbindB = $store.listen((value) => {
            events.push(`b${value.a}`)
        })

        $store.setKey('a', 1)
        assert.deepEqual(events, ['a1', 'b1'])

        $store.setKey('a', 2)
        assert.deepEqual(events, ['a1', 'b1', 'a2', 'c2'])
    })
})
