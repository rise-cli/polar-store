import { atom } from '../atom/atom.mjs'

export let atomMap = (value = {}) => {
    let map = atom(value)

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
