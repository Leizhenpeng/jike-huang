import { getRunEnv, injectScript } from '../utils'

;(() => {
  {
    const runEnv = getRunEnv()

    const injectScript_ = () => {
      injectScript(chrome.runtime.getURL('scripts/notifications.min.js'))
    }
    injectScript_()
  }
})()
