export class ListenerQueue {
    queue = []
    isEmpty = () => {
        return this.queue.length === 0
    }

    empty = () => {
        this.queue.length = 0
    }

    add = (props) => {
        if (typeof props.listener !== 'function')
            throw new Error('object must have a listener function')
        if (typeof props.level !== 'number')
            throw new Error('object must have a level number')
        this.queue.push(props)
    }

    emit = () => {
        for (let i = 0; i < this.queue.length; i += 1) {
            const currentListener = this.queue[i]
            const currentIsLowest = this.isListenerTheLowestInTheRestOfTheQueue(
                i,
                currentListener
            )

            if (!currentIsLowest) {
                // add the curent to the end of array, this will cause a duplicate
                // example, if [1,2,3], and we are 2,
                // this will will push to the end, and be [1,2,3,2]
                this.queue.push(currentListener)
            } else {
                currentListener.listener(
                    currentListener.value,
                    currentListener.changedKey
                )
            }
        }
    }

    isListenerTheLowestInTheRestOfTheQueue = (
        startingIndex,
        currentListener
    ) => {
        let isLowest = true
        for (let i = startingIndex; i < this.queue.length; i += 1) {
            if (!isLowest) break
            if (currentListener.level > this.queue[i].level) isLowest = false
        }
        return isLowest
    }
}
