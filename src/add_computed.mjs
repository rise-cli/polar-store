import { atom } from './atom.mjs'
import { onMount } from './add_lifecycle.mjs'

export let computed = (stores, cb) => {
    if (!Array.isArray(stores)) stores = [stores]

    let diamondArgs
    let run = () => {
        let args = stores.map(($store) => $store.get())
        if (
            diamondArgs === undefined ||
            args.some((arg, i) => arg !== diamondArgs[i])
        ) {
            diamondArgs = args
            $computed.set(cb(...args))
        }
    }
    let $computed = atom(undefined, Math.max(...stores.map((s) => s.level)) + 1)

    onMount($computed, () => {
        let unbinds = stores.map(($store) =>
            $store.listen(run, $computed.level)
        )
        run()
        return () => {
            for (let unbind of unbinds) unbind()
        }
    })

    return $computed
}
