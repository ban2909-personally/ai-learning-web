import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { useCommunityApi } from './useCommunityApi'

type Message = {
  id: string
  sequence: number
  authorId: string
  authorName: string
  body: string
  removed: boolean
  createdAt: string
}
type ChatPage = {
  messages: Message[]
  oldestSequence: number
  newestSequence: number
  hasMore: boolean
}

export function SpaceChat({
  spaceId,
  name,
  manager,
}: {
  spaceId: string
  name: string
  manager: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className="community-card community-chat-box">
      <button
        className="community-chat-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ◉ Chat · {name} <span>{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <ChatContent spaceId={spaceId} manager={manager} />
      ) : (
        <p className="community-muted">
          Trò chuyện với các thành viên của không gian.
        </p>
      )}
    </section>
  )
}

function ChatContent({
  spaceId,
  manager,
}: {
  spaceId: string
  manager: boolean
}) {
  const { user } = useAuth()
  const { read, write } = useCommunityApi()
  const [messages, setMessages] = useState<Message[]>([])
  const [hasOlder, setHasOlder] = useState(false)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [olderLoading, setOlderLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const newest = useRef(0)
  const pending = useRef<{ clientId: string; body: string } | null>(null)
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let initial = true
    let polls = 0
    let running = false
    const poll = async () => {
      if (!active || document.hidden || running) return
      running = true
      const catchingUp = !initial
      let delay = 5000
      try {
        const page = await read<ChatPage>(
          `/community/spaces/${spaceId}/chat${initial ? '' : `?after=${newest.current}`}`,
          { signal: controller.signal },
        )
        if (!active) return
        if (initial) {
          setMessages(page.messages)
          setHasOlder(page.hasMore)
        } else setMessages((current) => mergeMessages(current, page.messages))
        newest.current = Math.max(newest.current, page.newestSequence)
        initial = false
        polls += 1
        if (polls % 6 === 0) {
          const recent = await read<ChatPage>(
            `/community/spaces/${spaceId}/chat`,
            { signal: controller.signal },
          )
          if (!active) return
          setMessages((current) => mergeMessages(current, recent.messages))
        }
        if (page.hasMore && catchingUp && page.messages.length === 50)
          delay = 250
        setError('')
      } catch (cause) {
        if (!active) return
        if (cause instanceof ApiError && [401, 403].includes(cause.status)) {
          setMessages([])
          setHasOlder(false)
        }
        setError(
          cause instanceof Error ? cause.message : 'Không tải được chat.',
        )
        delay = 20_000
      } finally {
        running = false
        if (active) {
          setLoading(false)
          timer = setTimeout(() => void poll(), delay)
        }
      }
    }
    const visibility = () => {
      if (timer) clearTimeout(timer)
      if (!document.hidden) timer = setTimeout(() => void poll(), 100)
    }
    document.addEventListener('visibilitychange', visibility)
    void poll()
    return () => {
      active = false
      controller.abort()
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [read, spaceId, retry])
  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (!body.trim() || sending) return
    const content = body.trim()
    if (!pending.current || pending.current.body !== content)
      pending.current = { clientId: crypto.randomUUID(), body: content }
    setSending(true)
    try {
      const message = await write<Message>(
        `/community/spaces/${spaceId}/chat`,
        'POST',
        pending.current,
      )
      setMessages((current) => mergeMessages(current, [message]))
      // Keep the polling cursor unchanged so a concurrently sent message is not skipped.
      pending.current = null
      setBody('')
      setError('')
      requestAnimationFrame(() =>
        list.current?.scrollTo?.({
          top: list.current.scrollHeight,
          behavior: 'smooth',
        }),
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không gửi được tin nhắn. Thử lại cùng nội dung sẽ không tạo bản sao.',
      )
    } finally {
      setSending(false)
    }
  }
  const older = async () => {
    if (!messages.length || olderLoading) return
    setOlderLoading(true)
    try {
      const page = await read<ChatPage>(
        `/community/spaces/${spaceId}/chat?before=${messages[0].sequence}`,
      )
      setMessages((current) => mergeMessages(page.messages, current))
      setHasOlder(page.hasMore)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không tải được lịch sử.',
      )
    } finally {
      setOlderLoading(false)
    }
  }
  const remove = async (message: Message) => {
    try {
      await write<void>(
        `/community/spaces/${spaceId}/chat/${message.id}`,
        'DELETE',
      )
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id ? { ...item, removed: true, body: '' } : item,
        ),
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không gỡ được tin nhắn.',
      )
    }
  }
  return (
    <div>
      {loading && <p role="status">Đang tải chat…</p>}
      {error && (
        <div className="community-error" role="alert">
          <p>{error}</p>
          <button onClick={() => setRetry((value) => value + 1)}>
            Kết nối lại
          </button>
        </div>
      )}
      {hasOlder && (
        <button
          className="community-more"
          disabled={olderLoading || messages.length >= 200}
          onClick={() => void older()}
        >
          Tin nhắn cũ hơn
        </button>
      )}
      <div
        className="community-chat-messages"
        ref={list}
        aria-label="Tin nhắn cộng đồng"
        aria-live="polite"
      >
        {!loading && !messages.length && !error && (
          <p className="community-muted">Bắt đầu cuộc trò chuyện đầu tiên.</p>
        )}
        {messages.map((message) => (
          <article className="community-chat-message" key={message.id}>
            <strong>{message.authorName}</strong>
            <time dateTime={message.createdAt}>
              {new Intl.DateTimeFormat('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(message.createdAt))}
            </time>
            <p>{message.removed ? 'Tin nhắn đã được gỡ.' : message.body}</p>
            {!message.removed && (manager || message.authorId === user?.id) && (
              <button
                aria-label={`Gỡ tin nhắn của ${message.authorName}`}
                onClick={() => void remove(message)}
              >
                Gỡ
              </button>
            )}
          </article>
        ))}
      </div>
      <form
        onSubmit={(event) => void send(event)}
        className="community-chat-compose"
      >
        <label className="sr-only" htmlFor="space-chat-body">
          Tin nhắn
        </label>
        <textarea
          id="space-chat-body"
          value={body}
          maxLength={2000}
          rows={2}
          disabled={sending}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Chia sẻ với cộng đồng…"
        />
        <button
          className="community-primary"
          disabled={sending || !body.trim()}
        >
          {sending ? 'Đang gửi…' : 'Gửi tin'}
        </button>
      </form>
      <small className="community-muted">
        Làm mới khi mở chat; chỉ thành viên đang hoạt động được truy cập.
      </small>
    </div>
  )
}

function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map(current.map((message) => [message.id, message]))
  incoming.forEach((message) => byId.set(message.id, message))
  return [...byId.values()].sort((a, b) => a.sequence - b.sequence).slice(-200)
}
