import { getPath, setPath } from './util_path.mjs'
import { ListenerQueue } from './util_listenerqueue.mjs'
const globalListenerQueue = new ListenerQueue()

/**
 * Internal Atom Class
 */
class Atom {
    listeners = []
    level = 0
    numberOfListeners = 0
    value = null

    constructor(initialValue, level) {
        this.level = level || 0
        this.value = initialValue
    }

    /**
     * Getter Setters
     */
    get = () => {
        if (!this.numberOfListeners) {
            this.listen(() => {})()
        }
        return this.value
    }

    set = (data) => {
        if (this.value === data) return
        this.value = data
        this.notify()
    }

    /**
     * Listeners
     */
    #addListener = (listener, listenerLevel) => {
        const item = {
            listener,
            level: listenerLevel || this.level,
            id: Symbol()
        }
        this.numberOfListeners = this.listeners.push(item)
        return item.id
    }

    #makeRemoveListener = (id) => {
        return () => {
            let index = this.listeners.findIndex((x) => x.id === id)
            if (~index) {
                this.listeners.splice(index, 1)
                if (!--this.numberOfListeners && this.off) {
                    this.off()
                }
            }
        }
    }

    listen = (listener, listenerLevel) => {
        const id = this.#addListener(listener, listenerLevel)
        return this.#makeRemoveListener(id)
    }

    subscribe = (listener, listenerLevel) => {
        let unsubscribe = this.listen(listener, listenerLevel)
        listener(this.value)
        return unsubscribe
    }

    /**
     * Notify
     */
    notify = (changedKey) => {
        let runListenerQueue = globalListenerQueue.isEmpty()

        for (let i = 0; i < this.listeners.length; i += 1) {
            globalListenerQueue.add({
                listener: this.listeners[i].listener,
                level: this.listeners[i].level,
                value: this.value,
                changedKey
            })
        }

        if (runListenerQueue) {
            globalListenerQueue.emit()
            globalListenerQueue.empty()
        }
    }

    off = () => {}
}

/**
 * Atoms
 */
export let atom = (initialValue, level) => {
    return new Atom(initialValue, level)
}

export function atomDeep(initial = {}) {
    let $deepMap = new Atom(initial)
    $deepMap.setKey = (key, value) => {
        if (getPath($deepMap.value, key) !== value) {
            $deepMap.value = setPath($deepMap.value, key, value)
            $deepMap.notify(key)
        }
    }
    return $deepMap
}

export let atomMap = (value = {}) => {
    let map = new Atom(value)

    map.setKey = function (key, newValue) {
        if (typeof newValue === 'undefined') {
            if (key in map.value) {
                map.value = { ...map.value }
                delete map.value[key]
                map.notify(key)
            }
        } else if (map.value[key] !== newValue) {
            map.value = {
                ...map.value,
                [key]: newValue
            }
            map.notify(key)
        }
    }

    return map
}
