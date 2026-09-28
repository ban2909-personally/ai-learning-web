import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { useCommunityApi } from '../community/useCommunityApi'
import { CommunityIcon } from '../community/CommunityIcon'
import type { DirectConversation, DirectMessage, DirectMessages } from './types'

export function DirectThread({
  conversation,
  inboxOpen,
  onClose,
  onChange,
}: {
  conversation: DirectConversation
  inboxOpen: boolean
  onClose: () => void
  onChange: (value: DirectConversation) => void
}) {
  const { user } = useAuth()
  const { read, write } = useCommunityApi()
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasOlder, setHasOlder] = useState(false)
  const [retry, setRetry] = useState(0)
  const [denied, setDenied] = useState(false)
  const newest = useRef(0)
  const pending = useRef<{ clientId: string; body: string } | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const path = `/community/direct/conversations/${conversation.id}`

  useEffect(() => {
    let active = true
    let initial = true
    let running = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    const poll = async () => {
      if (!active || document.hidden || running) return
      running = true
      let delay = 5000
      try {
        const page = await read<DirectMessages>(
          `${path}/messages${initial ? '' : `?after=${newest.current}`}`,
          { signal: controller.signal },
        )
        if (!active) return
        if (initial) {
          setMessages(page.messages)
          setHasOlder(page.hasMore)
        } else setMessages((current) => merge(current, page.messages))
        newest.current = Math.max(newest.current, page.newestSequence)
        if (!initial && page.hasMore) delay = 250
        initial = false
        // Only mark fetched messages as read; an optimistic outgoing message must not skip incoming messages.
        if (page.newestSequence > 0)
          await write<void>(`${path}/read`, 'POST', {
            sequence: page.newestSequence,
          })
        if (active) {
          setDenied(false)
          setError('')
        }
      } catch (cause) {
        if (!active) return
        if (
          cause instanceof ApiError &&
          [401, 403, 404].includes(cause.status)
        ) {
          setMessages([])
          setHasOlder(false)
          setDenied(true)
        }
        setError(
          cause instanceof Error ? cause.message : 'Không tải được tin nhắn.',
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
  }, [path, read, write, retry])

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || denied || !body.trim() || conversation.status !== 'ACTIVE')
      return
    const text = body.trim()
    if (!pending.current || pending.current.body !== text)
      pending.current = { clientId: crypto.randomUUID(), body: text }
    setBusy(true)
    try {
      const message = await write<DirectMessage>(
        `${path}/messages`,
        'POST',
        pending.current,
      )
      setMessages((current) => merge(current, [message]))
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
          : 'Không gửi được tin nhắn. Bạn có thể thử lại.',
      )
    } finally {
      setBusy(false)
    }
  }
  const decide = async (accept: boolean) => {
    setBusy(true)
    try {
      onChange(
        await write<DirectConversation>(`${path}/decision`, 'POST', { accept }),
      )
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không xử lý được lời mời.',
      )
    } finally {
      setBusy(false)
    }
  }
  const older = async () => {
    if (busy || !messages.length) return
    setBusy(true)
    try {
      const page = await read<DirectMessages>(
        `${path}/messages?before=${messages[0].sequence}`,
      )
      setMessages((current) => merge(page.messages, current))
      setHasOlder(page.hasMore)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không tải được lịch sử.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      className={'direct-thread' + (inboxOpen ? ' beside-inbox' : '')}
      role="dialog"
      aria-label={`Chat với ${conversation.peerName}`}
    >
      <header>
        <span className="direct-avatar">
          {conversation.peerName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <strong>{conversation.peerName}</strong>
          <small>
            {conversation.status === 'ACTIVE'
              ? 'Trò chuyện riêng'
              : conversation.status === 'REQUEST'
                ? 'Lời mời trò chuyện'
                : 'Lời mời đã bị từ chối'}
          </small>
        </div>
        <button aria-label="Đóng cuộc trò chuyện" onClick={onClose}>
          <CommunityIcon name="close" />
        </button>
      </header>
      <div
        className="direct-messages"
        ref={list}
        aria-label="Tin nhắn riêng"
        aria-live="polite"
      >
        {loading && <p role="status">Đang tải tin nhắn…</p>}
        {hasOlder && (
          <button
            className="community-more"
            disabled={busy || messages.length >= 200}
            onClick={() => void older()}
          >
            Tin nhắn cũ hơn
          </button>
        )}
        {messages.map((message) => (
          <article
            key={message.id}
            className={
              'direct-bubble' + (message.authorId === user?.id ? ' own' : '')
            }
          >
            <p>{message.body}</p>
            <time dateTime={message.createdAt}>
              {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          </article>
        ))}
      </div>
      {conversation.status === 'REQUEST' && (
        <div className="direct-request">
          <p>
            {conversation.initiatorId === user?.id
              ? 'Đang chờ người nhận chấp nhận lời mời.'
              : 'Chấp nhận để hai bạn có thể tiếp tục trò chuyện.'}
          </p>
          {conversation.initiatorId !== user?.id && (
            <div>
              <button
                className="community-primary"
                disabled={busy || denied}
                onClick={() => void decide(true)}
              >
                Chấp nhận
              </button>
              <button
                disabled={busy || denied}
                onClick={() => void decide(false)}
              >
                Từ chối
              </button>
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="community-error" role="alert">
          {error}
          <button onClick={() => setRetry((value) => value + 1)}>
            Kết nối lại
          </button>
        </div>
      )}
      {conversation.status === 'ACTIVE' && (
        <form className="direct-compose" onSubmit={(event) => void send(event)}>
          <textarea
            aria-label="Tin nhắn riêng mới"
            placeholder="Nhập tin nhắn…"
            maxLength={2000}
            rows={2}
            value={body}
            disabled={busy || denied}
            onChange={(event) => setBody(event.target.value)}
          />
          <button
            aria-label="Gửi tin nhắn riêng"
            disabled={busy || denied || !body.trim()}
          >
            <CommunityIcon name="send" />
          </button>
        </form>
      )}
      <small className="direct-refresh-note">
        Làm mới khi mở chat · nội dung chỉ dành cho hai người.
      </small>
    </section>
  )
}

function merge(current: DirectMessage[], incoming: DirectMessage[]) {
  const byId = new Map(current.map((item) => [item.id, item]))
  incoming.forEach((item) => byId.set(item.id, item))
  return [...byId.values()].sort((a, b) => a.sequence - b.sequence).slice(-200)
}
