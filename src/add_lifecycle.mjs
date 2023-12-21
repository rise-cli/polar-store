const START = 0
const STOP = 1
const SET = 2
const NOTIFY = 3
const MOUNT = 5
const UNMOUNT = 6
const ACTION = 7
const REVERT_MUTATION = 10

export let STORE_UNMOUNT_DELAY = 1000

export let on = (object, listener, eventKey, mutateStore) => {
    object.events = object.events || {}
    if (!object.events[eventKey + REVERT_MUTATION]) {
        object.events[eventKey + REVERT_MUTATION] = mutateStore(
            (eventProps) => {
                // eslint-disable-next-line no-sequences
                object.events[eventKey].reduceRight(
                    (event, l) => (l(event), event),
                    {
                        shared: {},
                        ...eventProps
                    }
                )
            }
        )
    }
    object.events[eventKey] = object.events[eventKey] || []
    object.events[eventKey].push(listener)
    return () => {
        let currentListeners = object.events[eventKey]
        let index = currentListeners.indexOf(listener)
        currentListeners.splice(index, 1)
        if (!currentListeners.length) {
            delete object.events[eventKey]
            object.events[eventKey + REVERT_MUTATION]()
            delete object.events[eventKey + REVERT_MUTATION]
        }
    }
}

export let onMount = (store, initialize) => {
    let listener = (payload) => {
        let destroy = initialize(payload)
        if (destroy) {
            store.events[UNMOUNT].push(destroy)
        }
    }
    return on(store, listener, MOUNT, (runListeners) => {
        let originListen = store.listen
        store.listen = (...args) => {
            if (!store.numberOfListeners && !store.active) {
                store.active = true
                runListeners()
            }
            return originListen(...args)
        }

        let originOff = store.off
        store.events[UNMOUNT] = []
        store.off = () => {
            originOff()
            setTimeout(() => {
                if (store.active && !store.numberOfListeners) {
                    store.active = false
                    for (let destroy of store.events[UNMOUNT]) destroy()
                    store.events[UNMOUNT] = []
                }
            }, STORE_UNMOUNT_DELAY)
        }

        return () => {
            store.listen = originListen
            store.off = originOff
        }
    })
}

export let onNotify = ($store, listener) =>
    on($store, listener, NOTIFY, (runListeners) => {
        let originNotify = $store.notify
        $store.notify = (changed) => {
            let isAborted
            let abort = () => {
                isAborted = true
            }

            runListeners({ abort, changed })
            if (!isAborted) return originNotify(changed)
        }
        return () => {
            $store.notify = originNotify
        }
    })
