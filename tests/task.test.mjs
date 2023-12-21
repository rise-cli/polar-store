import test from 'node:test'
import assert from 'node:assert'
import { allTasks, startTask, task } from '../index.mjs'

test('waits no tasks', async (t) => {
    await allTasks()
    assert.strictEqual(1, 1)
})

test('waits for nested tasks', async (t) => {
    let track = ''

    async function taskA() {
        let end = startTask()
        await Promise.resolve()
        taskB()
        track += 'a'
        end()
    }

    async function taskB() {
        let result = await task(async () => {
            await Promise.resolve()
            track += 'b'
            return 5
        })

        assert.strictEqual(result, 5)
    }

    taskA()
    await allTasks()
    assert.strictEqual(track, 'ab')
})

test('ends task on error', async () => {
    let error = Error('test(')
    let catched

    try {
        await task(async () => {
            await Promise.resolve()
            throw error
        })
    } catch (e) {
        if (e instanceof Error) catched = e
    }

    assert.strictEqual(catched, error)
    await allTasks()
})
