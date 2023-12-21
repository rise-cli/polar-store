import test from 'node:test'
import assert from 'node:assert'

import { getPath, setPath } from '../src/util_path.mjs'

test('path evaluates correct value', () => {
    let exampleObj = {
        a: '123',
        b: { c: 123, d: [{ e: 123 }] }
    }

    assert.deepEqual(getPath(exampleObj, 'a'), '123')
    assert.deepEqual(getPath(exampleObj, 'b.c'), 123)
    assert.deepEqual(getPath(exampleObj, 'b.d[0]'), { e: 123 })
    assert.deepEqual(getPath(exampleObj, 'b.d[0].e'), 123)

    assert.deepEqual(getPath(exampleObj, 'abra.cadabra.booms'), undefined)
})

test('simple path setting', () => {
    let initial = { a: { e: 123 }, f: '' }

    initial = setPath(initial, 'f', 'hey')
    initial = setPath(initial, 'f', 'hey')
    assert.deepEqual(initial, { a: { e: 123 }, f: 'hey' })
})

test('creating objects', () => {
    let initial = {}

    setPath(initial, 'a.b.c.d', 'val')
    assert.deepEqual(initial.a?.b?.c?.d, 'val')
})

test('creating arrays', () => {
    let initial = {}

    setPath(initial, 'a[0]', 'val')
    assert.deepEqual(initial, { a: ['val'] })
    setPath(initial, 'a[3]', 'val3')
    assert.deepEqual(initial, { a: ['val', undefined, undefined, 'val3'] })
})

test('removes arrays', () => {
    let initial = { a: ['a', 'b'] }

    setPath(initial, 'a[1]', undefined)
    assert.deepEqual(initial, { a: ['a'] })

    setPath(initial, 'a[0]', undefined)
    assert.deepEqual(initial, { a: [] })
})

test('changes object reference, when this level key is changed', () => {
    let b = { c: 1, d: '1' }
    let a = { b, e: 1 }

    let initial = { a }

    setPath(initial, 'a.b.c', 2)
    assert.deepEqual(initial.a, a)
    assert.notDeepEqual(initial.a.b, b)

    setPath(initial, 'a.e', 2)
    assert.notDeepEqual(initial.a, a)
})

test('array items mutation changes identity on the same level', () => {
    let arr1 = { a: 1 }
    let arr2 = { a: 2 }
    let d = [arr1, arr2]
    let c = { d }

    let initial = { a: { b: { c } } }
    {
        let newInitial = setPath(initial, 'a.b.c.d[1].a', 3)
        assert.deepEqual(newInitial.a.b.c.d, d)
        assert.deepEqual(newInitial.a.b.c.d[0], d[0])
        assert.notDeepEqual(newInitial.a.b.c.d[1], arr2)
        assert.deepEqual(newInitial.a.b.c.d[1], { a: 3 })
    }
})
