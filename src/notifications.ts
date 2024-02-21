//ts-ignore
// 常量配置

import { StorageKey } from './constants'
import { getStorage, getStorageSync, toCamelCase } from './utils'

const API_ENDPOINT = 'https://web-api.okjike.com/api/graphql'
const OKJIKE_WEB_URL = 'https://web.okjike.com'
const JIKE_APP_URL_SCHEMA = 'jike://page.jk'

// 通知响应的接口
interface NotificationResponse {
  data: {
    viewer: {
      notifications: {
        nodes: {
          referenceItem: any
          linkUrl: string
          linkType: string
          actionItem: {
            users: {
              username: string
            }[]
          }
        }[]
      }
    }
  }
}

// fetch请求拦截函数
function interceptRequest() {
  const originFetch = window.fetch as any
  window.fetch = async (url: RequestInfo, request: RequestInit): Promise<Response> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const response = await originFetch(url, request).catch((e: any) => {
      console.error('网络请求失败:', e)
      throw e
    })
    // console.log('请求URL:', url)
    if (url === API_ENDPOINT) {
      try {
        const reqBody = request.body as string
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const text = (await response.clone().text()) as string
        const req = JSON.parse(reqBody)
        const res: NotificationResponse = JSON.parse(text)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (req.operationName === 'ListNotification') {
          // 如果没有查询到,过300ms后再次查询,直到查询到为止,最多查询5次
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          maxQueryTimes(addNotificationLink.bind(null, res), 5, 500).catch((e) => {
            console.error('查询通知节点失败:', e)
          })
        }
      } catch (e) {
        console.error('拦截处理即刻API时出错:', e)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response
  }
}
interceptRequest()

function maxQueryTimes(func: Function, times = 5, delay = 300) {
  return new Promise((resolve, reject) => {
    let count = 0
    const timer = setInterval(async () => {
      if (count >= times) {
        clearInterval(timer)
        reject('查询次数超过最大值')
      }
      if (await func()) {
        clearInterval(timer)
        resolve('查询成功')
      }
      console.log('查询次数:', count)
      count++
    }, delay)
  })
}

function addNotificationLink(res: NotificationResponse): boolean {
  const nodes = res.data.viewer.notifications.nodes
  const notificationsEl = document.querySelectorAll('[class^="Notification__NotiItemContainer"]')

  // 过滤掉已经处理过的元素
  const filteredNotificationsEl = Array.from(notificationsEl).filter((elem) => {
    return !elem.classList.contains('jike-notification-link-added')
  })
  if (nodes.length === 0) {
    return false
  }

  if (nodes.length !== filteredNotificationsEl.length) {
    console.warn('通知元素数量与节点数据不一致，可能会导致链接添加错误。')
  }

  nodes.forEach((node, index) => {
    // 这个地方不对，如果数据不一致，可能会导致错误。
    const elem = filteredNotificationsEl[index] as HTMLElement

    if (node.linkUrl) {
      let url = node.linkUrl.replace(JIKE_APP_URL_SCHEMA, OKJIKE_WEB_URL)
      if (node.linkType === 'COMMENT') {
        // "jike://page.jk/originalPost/65c9d072164d89e601e62702?locateCommentId=65ce0e8bf766db7481825ebd"
        //65c9d072164d89e601e62702   65ce0e8bf766db7481825ebd
        // "jike://page.jk/comment/65cb88ff3a0df77ea77b70c0?targetType=ORIGINAL_POST&targetId=65cb7d1912ed2fda68601124"
        //65cb7d1912ed2fda68601124   65cb7d1912ed2fda68601124
        // ike://page.jk/comment/65cb8de0980a4270631f5411?targetType=REPOST&targetId=65cb8d89164d89e60107547b",
        // const postId = node.linkUrl.split('originalPost/').pop()?.split('?').shift();
        const postId = node.linkUrl.split('targetId=').pop()?.split('&').shift()
        const postType =
          node.linkUrl.split('targetType=').pop()?.split('&').shift() ?? 'ORIGINAL_POST'
        url = `${OKJIKE_WEB_URL}/${toCamelCase(postType)}/${postId}`
      }
      if (node.linkType === 'USER') {
        // "jike://page.jk/user/572ff18b-9121-416a-9490-e91997e2a2a8" 572ff18b-9121-416a-9490-e91997e2a2a8
        const userId = node.linkUrl.split('user/').pop()
        url = `${OKJIKE_WEB_URL}/u/${userId}`
      }
      if (node.linkType === 'REPOST') {
        const repostId = node.linkUrl.split('repost/').pop()
        url = `${OKJIKE_WEB_URL}/repost/${repostId}`
      }
      // 短时间连续被@ 触发的通知 先跳转到用户主页
      if (node.linkType === 'MERGED_MENTION') {
        const users = node.actionItem.users
        if (users.length > 0) {
          const userId = users[0].username
          url = `${OKJIKE_WEB_URL}/u/${userId}`
        } else {
          url = OKJIKE_WEB_URL
        }
      }

      elem.addEventListener('click', (event) => {
        // 当前页面打开链接，不要在新标签页打开。
        window.location.href = url
      })
    }
  })

  notificationsEl.forEach((elem) => {
    // 增加一个样式类，用于标记已经处理过的元素。
    elem.classList.add('jike-notification-link-added')
  })
  console.log('添加通知链接成功')

  return true
}
