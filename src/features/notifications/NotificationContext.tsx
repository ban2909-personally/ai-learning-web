import { Client, type IMessage } from '@stomp/stompjs'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { resolveWebSocketUrl } from '../../lib/api'
import type { NotificationItem, NotificationPage } from '../../types/notification'
import { useAuth } from '../auth/AuthContext'

type NotificationContextValue = {
  notifications: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  isConnected: boolean
  error: string | null
  hasMore: boolean
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  markRead: (notificationId: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)
const PAGE_SIZE = 20
const MAX_VISIBLE_NOTIFICATIONS = 100

export function NotificationProvider({ children }: PropsWithChildren) {
  const { user, request, getAccessToken } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [isConnected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const knownIds = useRef(new Set<string>())

  const merge = useCallback((incoming: NotificationItem[]) => {
    setNotifications((current) => {
      const source = [...current, ...incoming]
      const unique = new Map(source.map((notification) => [notification.id, notification]))
      const sorted = [...unique.values()]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, MAX_VISIBLE_NOTIFICATIONS)
      knownIds.current = new Set(sorted.map((notification) => notification.id))
      return sorted
    })
  }, [])

  const fetchPage = useCallback(async (before?: string, signal?: AbortSignal) => {
    const query = new URLSearchParams({ limit: PAGE_SIZE.toString() })
    if (before) query.set('before', before)
    return request<NotificationPage>(`/me/notifications?${query}`, { signal })
  }, [request])

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const page = await fetchPage()
      merge(page.content)
      setNextCursor(page.nextCursor)
      setUnreadCount((current) => Math.max(current, page.unreadCount))
    } catch (loadError) {
      setError(message(loadError, 'Không thể tải thông báo.'))
    } finally {
      setLoading(false)
    }
  }, [fetchPage, merge, user])

  const loadMore = useCallback(async () => {
    if (!user || !nextCursor || isLoading) return
    setLoading(true)
    setError(null)
    try {
      const page = await fetchPage(nextCursor)
      merge(page.content)
      setNextCursor(page.nextCursor)
      setUnreadCount(page.unreadCount)
    } catch (loadError) {
      setError(message(loadError, 'Không thể tải thêm thông báo.'))
    } finally {
      setLoading(false)
    }
  }, [fetchPage, isLoading, merge, nextCursor, user])

  const markRead = useCallback(async (notificationId: string) => {
    try {
      const updated = await request<NotificationItem>(`/me/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      setNotifications((current) => current.map((notification) =>
        notification.id === updated.id ? updated : notification
      ))
      setUnreadCount((current) => {
        const wasUnread = notifications.some((notification) =>
          notification.id === updated.id && notification.readAt === null
        )
        return wasUnread ? Math.max(0, current - 1) : current
      })
    } catch (readError) {
      setError(message(readError, 'Không thể đánh dấu thông báo đã đọc.'))
      throw readError
    }
  }, [notifications, request])

  useEffect(() => {
    if (!user) {
      knownIds.current.clear()
      setNotifications([])
      setUnreadCount(0)
      setNextCursor(null)
      setConnected(false)
      setError(null)
      return
    }

    let active = true
    let connectedOnce = false
    const abort = new AbortController()
    const catchUp = async () => {
      try {
        const page = await fetchPage(undefined, abort.signal)
        if (!active) return
        merge(page.content)
        setNextCursor(page.nextCursor)
        setUnreadCount((current) => Math.max(current, page.unreadCount))
      } catch (loadError) {
        if (active && !isAbort(loadError)) {
          setError(message(loadError, 'Không thể đồng bộ thông báo.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    setLoading(true)
    void catchUp()
    const client = new Client({
      brokerURL: resolveWebSocketUrl('/ws/notifications'),
      reconnectDelay: 5_000,
      connectionTimeout: 10_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      discardWebsocketOnCommFailure: true,
      beforeConnect: async () => {
        client.connectHeaders = { Authorization: `Bearer ${await getAccessToken()}` }
      },
      onConnect: () => {
        if (!active) return
        setConnected(true)
        setError(null)
        client.subscribe('/user/queue/notifications', receive)
        if (connectedOnce) void catchUp()
        connectedOnce = true
      },
      onWebSocketClose: () => {
        if (active) setConnected(false)
      },
      onStompError: () => {
        if (active) setError('Kết nối thông báo đang tạm gián đoạn.')
      },
    })

    function receive(frame: IMessage) {
      const incoming = parseNotification(frame.body)
      if (!incoming || knownIds.current.has(incoming.id)) return
      knownIds.current.add(incoming.id)
      setNotifications((current) => [incoming, ...current].slice(0, MAX_VISIBLE_NOTIFICATIONS))
      if (incoming.readAt === null) setUnreadCount((current) => current + 1)
    }

    client.activate()
    return () => {
      active = false
      abort.abort()
      void client.deactivate()
    }
  }, [fetchPage, getAccessToken, merge, user?.id])

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    error,
    hasMore: nextCursor !== null,
    refresh,
    loadMore,
    markRead,
  }), [error, isConnected, isLoading, loadMore, markRead, nextCursor, notifications, refresh, unreadCount])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider')
  return context
}

function parseNotification(value: string): NotificationItem | null {
  try {
    const parsed = JSON.parse(value) as Partial<NotificationItem>
    if (typeof parsed.id !== 'string' || typeof parsed.title !== 'string' || typeof parsed.body !== 'string') return null
    if (typeof parsed.targetPath !== 'string' || !/^\/(?!\/)/.test(parsed.targetPath)) return null
    if (typeof parsed.createdAt !== 'string' || Number.isNaN(Date.parse(parsed.createdAt))) return null
    if (parsed.readAt !== null && typeof parsed.readAt !== 'string') return null
    if (parsed.type !== 'LESSON_COMPLETED') return null
    return parsed as NotificationItem
  } catch {
    return null
  }
}

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}
