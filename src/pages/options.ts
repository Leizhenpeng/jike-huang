import { AtSign, createIcons, Plus, Settings, X } from 'lucide'

import { JIKE, StorageKey } from '../constants'
import type { Options } from '../types'
import { getStorage, setStorage } from '../utils'

function loadIcons() {
  createIcons({
    attrs: { width: '100%', height: '100%' },
    icons: {
      Settings,
      AtSign,
      Plus,
      X,
    },
  })
}

const saveOptions = async () => {
  const currentOptions: Options = {
    // viewContent: {
    //   openInNewTab: $('#openInNewTab').prop('checked'),
    // },
    notification: {
      jumpToDetail: $('#jumpToDeatil').prop('checked'),
    },
  }

  await setStorage(StorageKey.Options, currentOptions)
}

void (async function init() {
  const perfersDark = window.matchMedia('(prefers-color-scheme: dark)')

  if (perfersDark.matches) {
    $(document.body).addClass('jike-theme-dark')
  }

  perfersDark.addEventListener('change', ({ matches }) => {
    if (matches) {
      $(document.body).addClass('jike-theme-dark')
    } else {
      $(document.body).removeClass('jike-theme-dark')
    }
  })

  loadIcons()

  const storage = await getStorage()

  // 初始化设置表单的值。
  {
    const options = storage[StorageKey.Options]

    // $('#openInNewTab').prop('checked', options.viewContent.openInNewTab)
    // console.log('options.notification.jumpToDetail', options.notification.jumpToDetail)
    $('#jumpToDeatil').prop('checked', options.notification.jumpToDetail)

    $('input[type]').on('change', () => {
      void saveOptions()
    })
  }

  // side-header onclick event, open website.https://web.okjike.com/
  {
    $('.side-header').on('click', () => {
      window.open(JIKE.Github, '_blank')
    })
  }

  {
    // find me
    const $author = $('.author')
    $author.on('click', () => {
      window.open(JIKE.Author, '_blank')
    })
  } // 控制切换显示菜单的内容。
  {
    const url = new URL(window.location.href)
    const DEFAULT_ACTIVE_KEY = 'settings'
    const MENU = 'menu'

    const menuKeys = new Set<string>()

    $('[data-menu-key]').each((_, ele) => {
      const menuKey = ele.dataset.menuKey

      if (typeof menuKey === 'string') {
        menuKeys.add(menuKey)
      }
    })

    const activeMenu = (activeKey = DEFAULT_ACTIVE_KEY) => {
      if (!menuKeys.has(activeKey)) {
        activeKey = DEFAULT_ACTIVE_KEY
      }

      $('[data-menu-key]').removeClass('active')
      $(`[data-menu-key="${activeKey}"]`).addClass('active')

      $('[data-content-key]').hide()
      $(`[data-content-key="${activeKey}"]`).show()

      if (activeKey === DEFAULT_ACTIVE_KEY) {
        url.searchParams.delete(MENU)
        history.replaceState(null, '', url.toString())
      } else {
        url.searchParams.set(MENU, activeKey)
        history.replaceState(null, '', url.toString())
      }
    }

    const initialMenuKey = url.searchParams.get(MENU) || DEFAULT_ACTIVE_KEY
    activeMenu(initialMenuKey)

    $('.menu-item').on('click', (ev) => {
      const $target = $(ev.currentTarget)
      const { menuKey } = $target.data()

      if (typeof menuKey === 'string') {
        activeMenu(menuKey)
      }
    })
  }
})()
