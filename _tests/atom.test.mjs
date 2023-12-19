import FakeTimers from '@sinonjs/fake-timers'
import { before, after, describe, it } from 'node:test'
import assert from 'node:assert'
import { atom, onMount } from '../index.mjs'

describe('atom', () => {
    let clock

    before(() => {
        clock = FakeTimers.install()
    })

    after(() => {
        clock.uninstall()
    })

    it('listens', () => {
        let calls = 0
        let store = atom({ some: { path: 0 } })
        let unsubscribe = store.listen((value) => {
            calls += 1
            assert.deepEqual(store.get(), value)
        })

        store.set({ some: { path: 1 } })
        store.set({ some: { path: 2 } })
        assert.deepEqual(store.get(), { some: { path: 2 } })
        assert.equal(calls, 2)
        unsubscribe()
    })

    it('subscribes', () => {
        let calls = 0
        let store = atom({ some: { path: 0 } })
        let unsubscribe = store.subscribe((value) => {
            calls += 1
            assert.deepEqual(store.get(), value)
        })

        store.set({ some: { path: 1 } })
        store.set({ some: { path: 2 } })
        assert.deepEqual(store.get(), { some: { path: 2 } })
        assert.equal(calls, 3)
        unsubscribe()
    })

    it('has default value', () => {
        let events = []
        let time = atom()
        assert.strictEqual(time.value, undefined)
        time.listen(() => {})
        time.listen(() => {})
        time.listen(() => {})
        let unsubscribe = time.subscribe((value) => {
            events.push(value)
        })
        time.set({ test: 2 })
        time.set({ test: 3 })
        assert.deepEqual(time.value, { test: 3 })
        assert.deepEqual(events, [undefined, { test: 2 }, { test: 3 }])
        unsubscribe()
    })

    it('initializes store when it has listeners', () => {
        let events = []

        let $store = atom('')

        onMount($store, () => {
            $store.set('initial')
            events.push('init')
            return () => {
                events.push('destroy')
            }
        })

        assert.deepEqual(events, [])

        let unbind1 = $store.listen((value) => {
            events.push(`1: ${value}`)
        })
        assert.deepEqual(events, ['init'])

        let unbind2 = $store.listen((value) => {
            events.push(`2: ${value}`)
        })
        assert.deepEqual(events, ['init'])

        $store.set('new')
        assert.deepEqual(events, ['init', '1: new', '2: new'])

        unbind1()
        clock.runAll()
        assert.deepEqual(events, ['init', '1: new', '2: new'])

        $store.set('new2')
        assert.deepEqual(events, ['init', '1: new', '2: new', '2: new2'])

        unbind2()
        assert.deepEqual(events, ['init', '1: new', '2: new', '2: new2'])

        let unbind3 = $store.listen(() => {})
        clock.runAll()
        assert.deepEqual(events, ['init', '1: new', '2: new', '2: new2'])

        unbind3()
        assert.deepEqual(events, ['init', '1: new', '2: new', '2: new2'])

        clock.runAll()
        assert.deepEqual(events, [
            'init',
            '1: new',
            '2: new',
            '2: new2',
            'destroy'
        ])
    })

    it('supports complicated case of last unsubscribing', () => {
        let events = []

        let $store = atom()

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
        function listener(value) {
            events.push(value)
        }

        let $store = atom()

        onMount($store, () => {
            return () => {
                events.push('destroy')
            }
        })

        let unbind1 = $store.listen(listener)
        let unbind2 = $store.listen(listener)
        $store.set('1')
        assert.deepEqual(events, ['1', '1'])

        unbind1()
        clock.runAll()
        $store.set('2')
        assert.deepEqual(events, ['1', '1', '2'])

        unbind2()
        clock.runAll()
        assert.deepEqual(events, ['1', '1', '2', 'destroy'])
    })

    it('supports double unsubscribe', () => {
        let store = atom('')
        let unsubscribe = store.listen(() => {})
        store.listen(() => {})

        unsubscribe()
        unsubscribe()

        assert.strictEqual(store.numberOfListeners, 1)
    })

    it('can subscribe to changes and call listener immediately', () => {
        let events = []

        let $store = atom()

        onMount($store, () => {
            $store.set('initial')
            return () => {
                events.push('destroy')
            }
        })

        let unbind = $store.subscribe((value) => {
            events.push(value)
        })

        assert.deepEqual(events, ['initial'])

        $store.set('new')
        assert.deepEqual(events, ['initial', 'new'])

        unbind()
        clock.runAll()
        assert.deepEqual(events, ['initial', 'new', 'destroy'])
    })

    it('supports starting store again', () => {
        let events = []

        let $store = atom()

        onMount($store, () => {
            $store.set('0')
            events.push('init')
            return () => {
                events.push('destroy')
            }
        })

        let unbind = $store.subscribe((value) => {
            events.push(value)
        })

        $store.set('1')

        unbind()
        clock.runAll()

        $store.set('2')

        $store.subscribe((value) => {
            events.push(value)
        })
        assert.deepEqual(events, ['init', '0', '1', 'destroy', 'init', '0'])
    })

    it('works without initializer', () => {
        let events = []
        let $store = atom()

        let unbind = $store.subscribe((value) => {
            events.push(value)
        })
        assert.deepEqual(events, [undefined])

        $store.set('new')
        assert.deepEqual(events, [undefined, 'new'])

        unbind()
        clock.runAll()
    })

    it('supports conditional destroy', () => {
        let events = []

        let destroyable = true
        let $store = atom()

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

    it('does not mutate listeners while change event', () => {
        let events = []
        let $store = atom()

        onMount($store, () => {
            $store.set(0)
        })

        $store.listen((value) => {
            events.push(`a${value}`)
            unbindB()
            $store.listen((v) => {
                events.push(`c${v}`)
            })
        })

        let unbindB = $store.listen((value) => {
            events.push(`b${value}`)
        })

        $store.set(1)
        assert.deepEqual(events, ['a1', 'b1'])

        $store.set(2)
        assert.deepEqual(events, ['a1', 'b1', 'a2', 'c2'])
    })

    it('prevents notifying when new value is referentially equal to old one', () => {
        let events = []

        let $store = atom('old')

        let unbind = $store.subscribe((value) => {
            events.push(value)
        })
        assert.deepEqual(events, ['old'])

        $store.set('old')
        assert.deepEqual(events, ['old'])

        $store.set('new')
        assert.deepEqual(events, ['old', 'new'])

        unbind()
        clock.runAll()
    })
})
