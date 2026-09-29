import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ApiError } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { useCommunityApi } from '../community/useCommunityApi'
import { CommunityIcon } from '../community/CommunityIcon'
import { DirectThread } from './DirectThread'
import type { DirectConversation, DirectInbox } from './types'
import type { PublicProfile } from '../community/types'
import { useDirectChatLauncher } from './DirectChatContext'

export function DirectChatMenu() {
  const { user } = useAuth()
  const { read, write } = useCommunityApi()
  const { launch, clearLaunch } = useDirectChatLauncher()
  const [open, setOpen] = useState(false)
  const [inbox, setInbox] = useState<DirectInbox | null>(null)
  const [filter, setFilter] = useState('all')
  const [loadedPages, setLoadedPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DirectConversation | null>(null)
  const [compose, setCompose] = useState(false)
  const [email, setEmail] = useState('')
  const [peer, setPeer] = useState<PublicProfile | null>(null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const button = useRef<HTMLButtonElement>(null)
  const pending = useRef<{
    recipient: string
    body: string
    clientId: string
  } | null>(null)
  useEffect(() => {
    if (!launch || !user) return
    const controller = new AbortController()
    setOpen(true)
    setSelected(null)
    setCompose(false)
    setError('')
    setBody('')
    setEmail('')
    setPeer(launch.person)
    pending.current = null
    void read<DirectConversation | null>(
      `/community/direct/peers/${launch.person.id}`,
      { signal: controller.signal },
    )
      .then((conversation) => {
        if (controller.signal.aborted) return
        if (conversation) setSelected(conversation)
        else setCompose(true)
        clearLaunch()
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error ? cause.message : 'Không mở được đoạn chat.',
          )
          clearLaunch()
        }
      })
    return () => controller.abort()
  }, [launch, user?.id, read, clearLaunch])
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    let running = false
    const load = async () => {
      if (!active || document.hidden || running) return
      running = true
      let delay = 5000
      try {
        let page = await read<DirectInbox>(
          `/community/direct/conversations?filter=${filter}`,
          { signal: controller.signal },
        )
        // Refresh every loaded page, not stale snapshots of unread/request entries.
        for (
          let index = 1;
          index < loadedPages && page.nextPage != null;
          index++
        ) {
          const next = await read<DirectInbox>(
            '/community/direct/conversations?filter=' +
              filter +
              '&page=' +
              page.nextPage,
            { signal: controller.signal },
          )
          const byId = new Map(
            page.conversations.map((item) => [item.id, item]),
          )
          next.conversations.forEach((item) => byId.set(item.id, item))
          page = { ...next, conversations: [...byId.values()].slice(0, 100) }
        }
        if (active && page) {
          setInbox(page)
          setError('')
        }
      } catch (cause) {
        if (active) {
          if (cause instanceof ApiError && [401, 403].includes(cause.status)) {
            setInbox(null)
            setSelected(null)
          }
          setError(
            cause instanceof Error
              ? cause.message
              : 'Không tải được đoạn chat.',
          )
        }
        delay = 20_000
      } finally {
        running = false
        if (active) setLoadingMore(false)
        if (active) timer = setTimeout(() => void load(), delay)
      }
    }
    const visibility = () => {
      if (timer) clearTimeout(timer)
      if (!document.hidden) timer = setTimeout(() => void load(), 100)
    }
    document.addEventListener('visibilitychange', visibility)
    void load()
    return () => {
      active = false
      controller.abort()
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [open, filter, read, retry, loadedPages])
  useEffect(() => {
    if (!open && !selected) return
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearLaunch()
        setOpen(false)
        setSelected(null)
        button.current?.focus()
      }
    }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [open, selected, clearLaunch])
  const start = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || (!peer && !email.trim()) || !body.trim()) return
    setBusy(true)
    const recipient = peer?.id ?? email.trim(),
      text = body.trim()
    if (
      !pending.current ||
      pending.current.recipient !== recipient ||
      pending.current.body !== text
    )
      pending.current = {
        recipient,
        body: text,
        clientId: crypto.randomUUID(),
      }
    try {
      const conversation = await write<DirectConversation>(
        peer
          ? `/community/direct/peers/${peer.id}`
          : '/community/direct/conversations',
        'POST',
        {
          clientId: pending.current.clientId,
          body: pending.current.body,
          ...(peer ? {} : { email: recipient }),
        },
      )
      setSelected(conversation)
      setCompose(false)
      setEmail('')
      setBody('')
      pending.current = null
      setRetry((value) => value + 1)
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không gửi được lời mời chat.',
      )
    } finally {
      setBusy(false)
    }
  }
  const current =
    inbox?.conversations.find((item) => item.id === selected?.id) ?? selected
  if (!user) return null
  return (
    <>
      <button
        ref={button}
        className="direct-chat-trigger"
        aria-label="Mở đoạn chat"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value)
          setError('')
        }}
      >
        <CommunityIcon name="chat" />
        {Boolean(inbox?.totalUnread) && (
          <span>{inbox!.totalUnread > 99 ? '99+' : inbox!.totalUnread}</span>
        )}
      </button>
      {createPortal(
        <>
          {open && (
            <section
              className={'direct-inbox-panel' + (current ? ' has-thread' : '')}
              role="dialog"
              aria-label="Đoạn chat"
            >
              <header>
                <h2>Đoạn chat</h2>
                <button
                  aria-label="Viết tin nhắn mới"
                  onClick={() => {
                    setPeer(null)
                    setSelected(null)
                    setBody('')
                    pending.current = null
                    setCompose((value) => !value)
                  }}
                >
                  <CommunityIcon name="compose" />
                </button>
                <button
                  aria-label="Đóng hộp thư"
                  onClick={() => {
                    clearLaunch()
                    setOpen(false)
                    button.current?.focus()
                  }}
                >
                  <CommunityIcon name="close" />
                </button>
              </header>
              <label className="direct-search">
                <CommunityIcon name="search" />
                <input
                  aria-label="Lọc đoạn chat đã tải"
                  placeholder="Tìm trong đoạn chat đã tải"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <div className="direct-inbox-tabs">
                {[
                  ['all', 'Tất cả'],
                  ['unread', 'Chưa đọc'],
                  ['requests', `Lời mời ${inbox?.requestCount || ''}`],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    onClick={() => {
                      setFilter(value)
                      setLoadedPages(1)
                      setInbox(null)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {compose && (
                <form
                  className="direct-new-chat"
                  onSubmit={(event) => void start(event)}
                >
                  {peer ? (
                    <p className="direct-peer-recipient">
                      Gửi đến <strong>{peer.displayName}</strong>
                    </p>
                  ) : (
                    <label>
                      Email người nhận
                      <input
                        type="email"
                        required
                        value={email}
                        maxLength={254}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="student@demo.local"
                      />
                    </label>
                  )}
                  <label>
                    Tin nhắn mở đầu
                    <textarea
                      required
                      value={body}
                      maxLength={2000}
                      onChange={(event) => setBody(event.target.value)}
                      rows={3}
                    />
                  </label>
                  <small>
                    Người nhận cần chấp nhận lời mời trước khi bạn gửi tiếp.
                  </small>
                  <button
                    className="community-primary"
                    disabled={busy || !body.trim()}
                  >
                    {busy ? 'Đang gửi…' : 'Gửi lời mời chat'}
                  </button>
                </form>
              )}
              <div className="direct-conversations">
                {!inbox ? (
                  <p className="community-muted">Đang tải hộp thư…</p>
                ) : !inbox.conversations.length ? (
                  <p className="community-muted">
                    Chưa có đoạn chat trong mục này.
                  </p>
                ) : (
                  inbox.conversations
                    .filter((item) =>
                      item.peerName
                        .toLocaleLowerCase()
                        .includes(search.toLocaleLowerCase()),
                    )
                    .map((item) => (
                      <button
                        className={
                          'direct-conversation' +
                          (current?.id === item.id ? ' is-selected' : '')
                        }
                        key={item.id}
                        onClick={() => setSelected(item)}
                      >
                        <span className="direct-avatar">
                          {item.peerName.slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <strong>{item.peerName}</strong>
                          <small>
                            {item.lastMessage ?? 'Lời mời trò chuyện'}
                          </small>
                          <em>
                            {item.status === 'REQUEST'
                              ? 'Lời mời đang chờ'
                              : new Date(item.updatedAt).toLocaleTimeString(
                                  'vi-VN',
                                  { hour: '2-digit', minute: '2-digit' },
                                )}
                          </em>
                        </span>
                        {item.unreadCount > 0 && (
                          <b aria-label={`${item.unreadCount} tin chưa đọc`}>
                            {item.unreadCount}
                          </b>
                        )}
                      </button>
                    ))
                )}
                {inbox?.nextPage != null && (
                  <button
                    className="community-more"
                    disabled={loadingMore || inbox.conversations.length >= 100}
                    onClick={() => {
                      setLoadingMore(true)
                      setLoadedPages((value) => Math.min(5, value + 1))
                    }}
                  >
                    Tải thêm đoạn chat
                  </button>
                )}
              </div>
              {error && (
                <p role="alert" className="community-error">
                  {error}
                  <button onClick={() => setRetry((value) => value + 1)}>
                    Thử lại
                  </button>
                </p>
              )}
            </section>
          )}
          {current && (
            <DirectThread
              key={current.id}
              conversation={current}
              inboxOpen={open}
              onClose={() => {
                setSelected(null)
                button.current?.focus()
              }}
              onChange={(value) => {
                setSelected(value)
                setInbox((old) =>
                  old
                    ? {
                        ...old,
                        conversations: old.conversations.map((item) =>
                          item.id === value.id ? value : item,
                        ),
                      }
                    : old,
                )
                setRetry((count) => count + 1)
              }}
            />
          )}
        </>,
        document.body,
      )}
    </>
  )
}
