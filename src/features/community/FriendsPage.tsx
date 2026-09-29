import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FriendshipActions } from './FriendshipActions'
import { useCommunityApi } from './useCommunityApi'
import type { FriendPage } from './types'

export function FriendsPage() {
  const { user } = useAuth()
  const { read } = useCommunityApi()
  const [filter, setFilter] = useState('accepted')
  const [result, setResult] = useState<FriendPage | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    if (page === 0) setResult(null)
    void read<FriendPage>(`/community/friends?filter=${filter}&page=${page}`, {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) {
          setLoadedFor(user?.id ?? null)
          setResult((previous) =>
            page === 0
              ? value
              : {
                  ...value,
                  people: [
                    ...(previous?.people ?? []),
                    ...value.people.filter(
                      (item) =>
                        !previous?.people.some(
                          (old) => old.person.id === item.person.id,
                        ),
                    ),
                  ],
                },
          )
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : 'Không tải được bạn bè.',
          )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [user?.id, filter, page, read, retry])
  return (
    <main className="social-friends-page">
      <Link to="/">← Về bảng tin</Link>
      <header>
        <small>KẾT NỐI CỘNG ĐỒNG</small>
        <h1>Bạn bè & lời mời</h1>
        <p>
          Những người cùng chia sẻ hành trình với bạn. Danh sách này chỉ mình
          bạn nhìn thấy.
        </p>
      </header>
      <nav className="social-profile-tabs" aria-label="Lọc kết nối">
        {[
          ['accepted', 'Bạn bè'],
          ['incoming', 'Lời mời đã nhận'],
          ['outgoing', 'Lời mời đã gửi'],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => {
              setResult(null)
              setPage(0)
              setFilter(value)
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="social-friends-grid">
        {(loadedFor === user?.id ? result?.people : [])?.map((item) => (
          <article className="social-friend-card" key={item.person.id}>
            <Link to={`/community/people/${item.person.id}`}>
              <span className="social-friend-avatar" aria-hidden="true">
                {item.person.displayName.slice(0, 1).toUpperCase()}
              </span>
              <h2>{item.person.displayName}</h2>
            </Link>
            <FriendshipActions
              person={item.person}
              relationship={item.relationship}
              onChange={() => {
                setResult(null)
                setPage(0)
                setRetry((value) => value + 1)
              }}
            />
          </article>
        ))}
      </div>
      {loading && <p role="status">Đang tải kết nối…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            className="community-more"
            onClick={() => setRetry((value) => value + 1)}
          >
            Thử lại
          </button>
        </div>
      )}
      {!loading && !error && result?.people.length === 0 && (
        <div className="social-friends-empty">
          <h2>Chưa có kết nối trong mục này</h2>
          <p>
            Tìm người bạn biết trên thanh tìm kiếm hoặc mở hồ sơ từ một bài
            viết.
          </p>
          <Link className="community-primary" to="/">
            Khám phá cộng đồng
          </Link>
        </div>
      )}
      {result?.nextPage != null && (
        <button
          className="community-more"
          disabled={loading}
          onClick={() => setPage(result.nextPage!)}
        >
          Tải thêm
        </button>
      )}
    </main>
  )
}
