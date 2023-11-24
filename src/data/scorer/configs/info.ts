import localforage from 'localforage'
export const version = import.meta.env.VITE_APP_VERSION

export async function checkVersion() {
    let result = await localforage.getItem('version')
    if (result) {
        if (version !== result) {
            return false
        } else {
            return true
        }
    }
    return false
}

export async function setVersion() {
    await localforage.setItem('version', version)
}

export async function upgrade(callback?: Function) {
    await setVersion();
    if (callback) {
        callback()
    }
}