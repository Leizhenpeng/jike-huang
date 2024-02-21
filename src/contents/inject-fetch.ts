import { StorageKey } from '../constants'
import { getStorage, injectScript } from '../utils'

async function ifInjectNotificationLink() {
  const storage = await getStorage(false)
  const options = storage[StorageKey.Options]
  return options.notification.jumpToDetail
}

;(() => {
  {
    const injectScript_ = () => {
      injectScript(chrome.runtime.getURL('scripts/notifications.min.js'))
    }
    ifInjectNotificationLink().then((shouldInject) => {
      if (shouldInject) {
        injectScript_()
      }
    })
  }
})()
