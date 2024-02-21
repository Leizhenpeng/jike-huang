import { createIcons, Plus, Settings, Tags, X } from 'lucide'

import { JIKE, StorageKey } from '../constants'
import type { Options } from '../types'
import { getStorage, setStorage } from '../utils'

function loadIcons() {
  createIcons({
    attrs: { width: '100%', height: '100%' },
    icons: {
      Settings,
      Tags,
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

  // 渲染已设置的用户标签列表。
  {
    const $contentTags = $('[data-content-key="tags"]')

    const renderTagsContent = async () => {
      const storage = await getStorage(false)
      const tagData = storage[StorageKey.MemberTag]

      $contentTags.empty()

      if (tagData) {
        const count = Object.keys(tagData).length

        if (count > 0) {
          const $tagList = $(`
            <div class="tags-list-wrapper">
              <div class="tags-tip">已设置 ${count} 条用户标签</div>
              <hr class="tags-divider" />
              <ul class="tags-list">
                ${Object.entries(tagData)
                  .map(([memberName, { tags, avatar }]) => {
                    if (tags && tags.length > 0) {
                      return `
                        <li class="tag-item">
                          <div class="tag-member-name">
                            <a href="${JIKE.Origin}/member/${memberName}" target="_blank">
                              ${avatar ? `<img src="${avatar}">` : ''}
                              <span>${memberName}：</span>
                            </a>
                          </div>

                          <div class="tag-item-tags">
                            ${
                              tags
                                .map((tag, idx) => {
                                  return `
                                    <span
                                      class="tag-item-tag"
                                      data-member-name="${memberName}"
                                      data-tag-idx="${idx}"
                                      data-tag-name="${tag.name}"
                                    >
                                      ${tag.name}

                                      <span class="tag-remove">
                                        <span data-lucide="x"></span>
                                      </span>
                                    </span>
                                  `
                                })
                                .join('') || ''
                            }

                            <span class="tag-item-tag tag-item-tag-add" data-member-name="${memberName}">
                              <span class="tag-add"><span data-lucide="plus"></span></span>
                              <span>添加标签</span>
                            </span>
                          </div>
                        </li>
                      `
                    }

                    return ''
                  })
                  .join('')}
              </ul>
            </div>
          `)

          $tagList.find('.tag-item-tag.tag-item-tag-add').on('click', (ev) => {
            void (async () => {
              const $target = $(ev.currentTarget)
              const { memberName } = $target.data()

              if (typeof memberName === 'string') {
                const newTagValue = window.prompt(`新增对 @${memberName} 的标签。`)

                if (typeof memberName === 'string') {
                  if (newTagValue && newTagValue.trim() !== '') {
                    const currentMemberTags = tagData[memberName].tags

                    if (currentMemberTags) {
                      await setMemberTags({
                        memberName,
                        tags: [...currentMemberTags, { name: newTagValue }],
                      })

                      renderTagsContent()
                    }
                  }
                }
              }
            })()
          })

          $tagList
            .find('.tag-item-tag')
            .not('.tag-item-tag-add')
            .on('click', (ev) => {
              void (async () => {
                const $target = $(ev.currentTarget)

                const { memberName, tagIdx, tagName: tn } = $target.data()
                const tagName = String(tn)

                if (typeof memberName === 'string' && typeof tagIdx === 'number') {
                  const changedTagValue = window.prompt(`修改 @${memberName} 的标签。`, tagName)

                  if (changedTagValue && changedTagValue.trim() !== '') {
                    const currentMemberTags = tagData[memberName].tags

                    if (currentMemberTags) {
                      await setMemberTags({
                        memberName,
                        tags: currentMemberTags.map((it, idx) =>
                          idx === tagIdx ? { name: changedTagValue } : it
                        ),
                      })

                      renderTagsContent()
                    }
                  }
                }
              })()
            })

          $tagList.find('.tag-remove').on('click', (ev) => {
            ev.stopPropagation()

            void (async () => {
              const $target = $(ev.currentTarget)
              const $tagItem = $target.closest('.tag-item-tag')
              const { memberName, tagIdx } = $tagItem.data()

              if (typeof memberName === 'string' && typeof tagIdx === 'number') {
                const currentMemberTags = tagData[memberName].tags

                if (currentMemberTags) {
                  if (currentMemberTags.length <= 1) {
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                    delete tagData[memberName]

                    await setStorage(StorageKey.MemberTag, tagData)
                  } else {
                    await setMemberTags({
                      memberName,
                      tags: currentMemberTags.filter((_, idx) => idx !== tagIdx),
                    })
                  }

                  renderTagsContent()
                }
              }
            })()
          })

          $contentTags.append($tagList)

          loadIcons()
        }
      } else {
        $contentTags.append($('#tags-empty').html())
      }
    }

    renderTagsContent()
  }

  // 控制切换显示菜单的内容。
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
