import { atom } from '../atom/atom.mjs'
import { getPath, setPath } from './path.mjs'

export { getPath, setPath } from './path.mjs'

export function atomDeep(initial = {}) {
    let $deepMap = atom(initial)
    $deepMap.setKey = (key, value) => {
        if (getPath($deepMap.value, key) !== value) {
            $deepMap.value = setPath($deepMap.value, key, value)
            $deepMap.notify(key)
        }
    }
    return $deepMap
}
