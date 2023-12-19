class TaskCount {
    taskCount = 0

    initialize = () => {
        this.taskCount = 0
    }

    add = () => {
        this.taskCount = this.taskCount + 1
    }

    isZero = () => {
        return this.taskCount < 1
    }

    subtract = () => {
        if (this.taskCount <= 1) {
            this.taskCount = 0
            return { isZero: true }
        } else {
            this.taskCount = this.taskCount - 1
            return { isZero: false }
        }
    }
}

class PromiseBuilder {
    resolvers = []

    makePausedPromise = () => {
        return new Promise((r) => {
            this.resolvers.push(r)
        })
    }

    makeCompletedPromise = () => {
        return Promise.resolve()
    }

    resolveAllPausedPromises = () => {
        const prevResolves = this.resolvers
        this.resolvers = []
        prevResolves.forEach((r) => r())
    }
}

const taskCount = new TaskCount()
const promiseBuilder = new PromiseBuilder()

export function startTask() {
    taskCount.add()
    return () => {
        const res = taskCount.subtract()
        if (res.isZero) {
            promiseBuilder.resolveAllPausedPromises()
        }
    }
}

export function task(asyncFunction) {
    const endTask = startTask()
    return asyncFunction().finally(endTask)
}

export function allTasks() {
    return taskCount.isZero()
        ? promiseBuilder.makeCompletedPromise()
        : promiseBuilder.makePausedPromise()
}

export function cleanTasks() {
    taskCount.initialize()
}
