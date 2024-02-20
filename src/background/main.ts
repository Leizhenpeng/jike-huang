import { Menu, MessageKey, StorageKey } from '../constants'
import { getRunEnv, getStorage } from '../utils'

interface Message {
  [MessageKey.action]?: 'openPopup'
  [MessageKey.colorScheme]?: 'dark' | 'light'
}

chrome.runtime.onMessage.addListener((message: Message) => {
  // if (Reflect.has(message, MessageKey.action)) {
  // if (message[MessageKey.action] === 'openPopup') {
  //   void chrome.action.openPopup()
  // }
  // }

  if (Reflect.has(message, MessageKey.colorScheme)) {
    void chrome.action.setIcon({
      path:
        message[MessageKey.colorScheme] === 'dark'
          ? {
              16: '../images/icon-16-dark.png',
              32: '../images/icon-32-dark.png',
              48: '../images/icon-48-dark.png',
              128: '../images/icon-128-dark.png',
            }
          : {
              16: '../images/icon-16.png',
              32: '../images/icon-32.png',
              48: '../images/icon-48.png',
              128: '../images/icon-128.png',
            },
    })
  }
})

chrome.contextMenus.removeAll(() => {
  const runEnv = getRunEnv()

  chrome.contextMenus.create({
    documentUrlPatterns: ['https://web.okjike.com/*'],
    contexts: ['page'],
    title: '黄吉吉',
    visible: true,
    id: Menu.Root,
  })

  if (runEnv === 'chrome' && 'sidePanel' in chrome && typeof chrome.sidePanel.open === 'function') {
    chrome.contextMenus.create({
      documentUrlPatterns: ['https://web.okjike.com/*'],
      contexts: ['page'],
      title: '选项设置',
      id: Menu.Options,
      parentId: Menu.Root,
    })
  }

  chrome.contextMenus.create({
    documentUrlPatterns: [
      'https://web.okjike.com/repost/*',
      'https://web.okjike.com/recommend/*',
      'https://web.okjike.com/originalPost/*',
    ],
    contexts: ['page'],
    title: '添加进稍后阅读',
    id: Menu.Reading,
    parentId: Menu.Root,
  })

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (tab?.id) {
      switch (info.menuItemId) {
        case Menu.Options: {
          chrome.sidePanel.open({ tabId: tab.id })
          break
        }

        case Menu.Reading: {
          void chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['scripts/reading-list.min.js'],
          })
          break
        }
      }
    }
  })
})

chrome.tabs.onUpdated.addListener((tabId, _, tab) => {
  if (!('sidePanel' in chrome)) {
    return
  }

  void (async () => {
    if (!tab.url) {
      return
    }

    const url = new URL(tab.url)

    if (url.origin === 'https://web.okjike.com') {
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'pages/options.html',
        enabled: true,
      })
    } else {
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false,
      })
    }
  })()
})

chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0]
    if (!('sidePanel' in chrome)) {
      return
    }
    const tabId = tab.id
    if (!tabId) {
      return
    }
    void (async () => {
      await chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: true,
      })
      await chrome.sidePanel.open({ tabId })
    })()
  })
})
