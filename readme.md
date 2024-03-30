# Polar Store

a refactor of nanostores:

https://github.com/nanostores/nanostores

# Install
```
curl https://raw.githubusercontent.com/rise-cli/polar-store/main/polar-store.js > polar-store.js
```
# Example

```js
import { atomDeep, listenKeys } from 'polar-store.js'

export const states = {
    READY: 'READY',
    SUBMITTING: 'SUBMITTING',
    ERROR: 'ERROR',
    SUCCESS: 'SUCCESS'
}

export const loginStore = atomDeep({
    username: '',
    state: states.READY,
    ui: {
        submitting: false,
        message: {
            active: false,
            text: '',
            type: 'info'
        }
    }
})

/**
 * Listening on store changes to change store
 */
listenKeys(loginStore, [`state`], async (x, key) => {
    if (x.state === states.SUBMITTING) {
        loginStore.setKey(`ui.submitting`, true)

        try {
            const res = await mockLoginCall()
            loginStore.setKey(`state`, states.SUCCESS)
            loginStore.setKey(`ui.message`, {
                active: true,
                text: 'Success',
                type: 'success'
            })

            setTimeout(() => {
                loginStore.setKey(`ui.message`, {
                    active: false,
                    text: '',
                    type: 'info'
                })
            }, 2000)
        } catch (e) {
            loginStore.setKey(`state`, states.ERROR)
            loginStore.setKey(`ui.message`, {
                active: true,
                text: 'There was an issue',
                type: 'error'
            })
        } finally {
            loginStore.setKey(`ui.submitting`, false)
        }
    }
})

/**
 * Listening store changes to change ui
 */
const setText = (ui, id, v) => (ui.querySelector(id).textContent = v)
const setAttr = (ui, id, att, v) => ui.querySelector(id).setAttribute(att, v)

const onStoreSubmittingUpdate = (ui, state) => {
    return listenKeys(loginStore, [`ui.submitting`], async (x, key) => {
        if (x.ui.submitting === true) {
            setAttr(ui, '#loginbutton', 'text', 'Logging in...')
            setAttr(ui, '#username', 'submitting', 'true')
            setAttr(ui, '#password', 'submitting', 'true')
        } else {
            setAttr(ui, '#loginbutton', 'text', 'Login')
            setAttr(ui, '#username', 'submitting', 'false')
            setAttr(ui, '#password', 'submitting', 'false')
        }
    })
}

const onStoreMessageStateUpdate = (ui, state) => {
    return listenKeys(loginStore, [`ui.message`], async (x, key) => {
        setAttr(ui, '#message', 'type', x.ui.message.type)
        setAttr(ui, '#message', 'active', x.ui.message.active)
        setText(ui, '#message', x.ui.message.text)
    })
}

/**
 * Listening on ui changes to change store
 */
const onAddClick = (ui, state) => {
    ui.querySelector('#loginbutton').addEventListener('s-click', (v) => {
        loginStore.setKey(`state`, states.SUBMITTING)
    })
}

const onInputChange = (ui, state) => {
    ui.querySelector('#username').addEventListener('s-change', (v) => {
        loginStore.setKey(`username`, v.detail.value)
    })
}
```
