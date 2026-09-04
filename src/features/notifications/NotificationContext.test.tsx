import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NotificationItem } from '../../types/notification'
import { useAuth } from '../auth/AuthContext'
import { NotificationProvider, useNotifications } from './NotificationContext'

type StompConfig = {
  beforeConnect: () => Promise<void>
  onConnect: () => void
  onWebSocketClose: () => void
}

type MockStompClient = {
  config: StompConfig
  connectHeaders: Record<string, string>
  activate: ReturnType<typeof vi.fn>
  deactivate: ReturnType<typeof vi.fn>
  subscribe: ReturnType<typeof vi.fn>
}

const stomp = vi.hoisted(() => ({ clients: [] as MockStompClient[] }))

vi.mock('@stomp/stompjs', () => ({
  Client: class {
    config: StompConfig
    connectHeaders: Record<string, string> = {}
    activate = vi.fn()
    deactivate = vi.fn().mockResolvedValue(undefined)
    subscribe = vi.fn()

    constructor(config: StompConfig) {
      this.config = config
      stomp.clients.push(this)
    }
  },
}))
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

describe('NotificationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stomp.clients.length = 0
  })

  it('combines HTTP catch-up with authenticated, de-duplicated realtime delivery', async () => {
    const history = notification('history', '2026-09-04T10:00:00Z')
    const incoming = notification('realtime', '2026-09-04T11:00:00Z')
    const request = vi.fn().mockImplementation(async (path: string) => {
      if (path.endsWith('/read')) {
        const id = path.split('/').at(-2)!
        const selected = id === incoming.id ? incoming : history
        return { ...selected, readAt: '2026-09-04T11:01:00Z' }
      }
      return { content: [history], nextCursor: null, unreadCount: 1 }
    })
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'f9739374-28f7-41ed-9538-99004f124fc4',
        email: 'student@example.com',
        displayName: 'Student',
        roles: ['STUDENT'],
      },
      accessToken: 'token',
      isLoading: false,
      getAccessToken: vi.fn().mockResolvedValue('fresh-token'),
      request,
      stream: vi.fn(),
      upload: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })

    render(<NotificationProvider><NotificationProbe /></NotificationProvider>)
    expect(await screen.findByText('history')).toBeInTheDocument()
    const client = stomp.clients[0]
    expect(client.activate).toHaveBeenCalledOnce()

    await act(() => client.config.beforeConnect())
    expect(client.connectHeaders).toEqual({ Authorization: 'Bearer fresh-token' })
    act(() => client.config.onConnect())
    await waitFor(() => expect(client.subscribe).toHaveBeenCalledWith(
      '/user/queue/notifications',
      expect.any(Function),
    ))

    const receive = client.subscribe.mock.calls[0][1] as (frame: { body: string }) => void
    act(() => receive({ body: JSON.stringify(incoming) }))
    act(() => receive({ body: JSON.stringify(incoming) }))
    act(() => receive({ body: JSON.stringify({ ...incoming, id: 'unsafe', targetPath: '//external.test' }) }))
    expect(screen.getByTestId('unread')).toHaveTextContent('2')
    expect(screen.getAllByText('realtime')).toHaveLength(1)
    expect(screen.queryByText('unsafe')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Đọc realtime' }))
    await waitFor(() => expect(screen.getByTestId('unread')).toHaveTextContent('1'))
    expect(request).toHaveBeenCalledWith('/me/notifications/realtime/read', { method: 'PATCH' })
  })
})

function NotificationProbe() {
  const { notifications, unreadCount, isConnected, markRead } = useNotifications()
  return (
    <div>
      <span data-testid="unread">{unreadCount}</span>
      <span>{isConnected ? 'connected' : 'offline'}</span>
      {notifications.map((item) => (
        <div key={item.id}>
          <span>{item.id}</span>
          <button type="button" onClick={() => void markRead(item.id)}>Đọc {item.id}</button>
        </div>
      ))}
    </div>
  )
}

function notification(id: string, createdAt: string): NotificationItem {
  return {
    id,
    type: 'LESSON_COMPLETED',
    title: 'Hoàn thành bài học',
    body: 'Bạn đã hoàn thành một bài học.',
    targetPath: '/my-learning',
    createdAt,
    readAt: null,
  }
}
