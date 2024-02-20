import { patternToRegex } from 'webext-patterns'

import { style } from './style'

if (typeof window.GM_addStyle !== 'undefined') {
  // 使用「GM_addStyle」配合「@run-at document-start」，可以解决样式切换导致的页面闪烁问题。
  window.GM_addStyle(style)
} else {
  document.addEventListener('DOMContentLoaded', () => {
    $(`<style type="text/css">${style}</style>`).appendTo('head')
  })
}

const allowedHosts = ['https://web.okjike.com/*']

const commonRegex = patternToRegex(...allowedHosts.map((host) => `${host}/*`))

document.addEventListener('DOMContentLoaded', () => {
  const url = window.location.href

  void (async () => {
    if (commonRegex.test(url)) {
      await import('../contents/inject-fetch')
    }
  })()
})
