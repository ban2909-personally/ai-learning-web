import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCommunityApi } from './useCommunityApi'
import { PostCard } from './PostCard'
import type { FeedPage, Post } from './types'

export function CommunityFeed({
  spaceId,
  canPost = true,
  canInteract = true,
  canModerate = false,
}: {
  spaceId?: string
  canPost?: boolean
  canInteract?: boolean
  canModerate?: boolean
}) {
  const { user, upload } = useAuth()
  const { read, write } = useCommunityApi()
  const [posts, setPosts] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [autoLoadFailed, setAutoLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [composerError, setComposerError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const feedScope = useRef(0)
  const moreInFlight = useRef(false)

  const load = useCallback(
    async (next?: string, signal?: AbortSignal) => {
      if (next && moreInFlight.current) return
      if (next) moreInFlight.current = true
      const scope = feedScope.current
      const params = new URLSearchParams({ size: '12' })
      if (spaceId) params.set('spaceId', spaceId)
      if (next) params.set('cursor', next)
      try {
        const page = await read<FeedPage>(
          `/community/feed?${params}`,
          signal ? { signal } : undefined,
        )
        if (scope !== feedScope.current || signal?.aborted) return
        setPosts((current) =>
          next
            ? [
                ...current,
                ...page.posts.filter(
                  (post) => !current.some((item) => item.id === post.id),
                ),
              ]
            : page.posts,
        )
        setCursor(page.nextCursor)
        setAutoLoadFailed(false)
        setError('')
      } catch (cause) {
        if (scope !== feedScope.current || signal?.aborted) return
        if (next) setAutoLoadFailed(true)
        setError(
          cause instanceof Error ? cause.message : 'Không tải được bảng tin.',
        )
      } finally {
        if (scope === feedScope.current && !signal?.aborted) {
          moreInFlight.current = false
          setLoading(false)
          setMoreLoading(false)
        }
      }
    },
    [read, spaceId],
  )

  useEffect(() => {
    feedScope.current += 1
    moreInFlight.current = false
    const controller = new AbortController()
    setPosts([])
    setCursor(null)
    setLoading(true)
    void load(undefined, controller.signal)
    return () => {
      feedScope.current += 1
      controller.abort()
    }
  }, [load])
  useEffect(() => {
    if (
      !cursor ||
      !sentinel.current ||
      loading ||
      moreLoading ||
      autoLoadFailed ||
      typeof IntersectionObserver === 'undefined'
    )
      return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMoreLoading(true)
          void load(cursor)
        }
      },
      { rootMargin: '360px' },
    )
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [autoLoadFailed, cursor, load, loading, moreLoading])

  const publish = async (event: FormEvent) => {
    event.preventDefault()
    if ((!body.trim() && !file) || submitting) return
    setSubmitting(true)
    try {
      let post: Post
      if (file) {
        const form = new FormData()
        form.append('file', file)
        form.append('body', body.trim())
        if (spaceId) form.append('spaceId', spaceId)
        post = await upload<Post>(
          '/community/posts/media',
          form,
          setProgress,
          'POST',
        )
      } else {
        post = await write<Post>('/community/posts', 'POST', {
          body: body.trim(),
          spaceId: spaceId ?? null,
          sharedPostId: null,
        })
      }
      if (post.status === 'PENDING') {
        setNotice('Bài viết đã gửi và đang chờ quản trị viên cộng đồng duyệt.')
      } else {
        setPosts((current) => [post, ...current])
        setNotice('')
      }
      setBody('')
      setComposerError('')
      setFile(null)
      setProgress(0)
      if (fileInput.current) fileInput.current.value = ''
      setError('')
    } catch (cause) {
      setComposerError(
        cause instanceof Error ? cause.message : 'Không đăng được bài viết.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="community-feed" aria-label="Bảng tin cộng đồng">
      {canPost &&
        (user ? (
          <form
            className="community-card community-composer"
            onSubmit={(event) => void publish(event)}
          >
            <div className="community-avatar">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="community-composer-content">
              <label htmlFor="new-post" className="sr-only">
                Nội dung bài viết
              </label>
              <textarea
                id="new-post"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={5000}
                placeholder={`Bạn muốn chia sẻ kiến thức gì, ${user.displayName}?`}
                rows={3}
                disabled={submitting}
              />
              <div className="community-composer-footer">
                <label className="community-file-button">
                  Ảnh / video
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    disabled={submitting}
                    aria-label="Ảnh hoặc video bài viết"
                    onChange={(event) => {
                      const selected = event.target.files?.[0] ?? null
                      if (
                        selected &&
                        (selected.size <= 0 ||
                          selected.size >= 10_000_000 ||
                          ![
                            'image/jpeg',
                            'image/png',
                            'image/webp',
                            'video/mp4',
                            'video/webm',
                          ].includes(selected.type))
                      ) {
                        setComposerError(
                          'Chọn JPEG, PNG, WebP, MP4 hoặc WebM nhỏ hơn 10 MB.',
                        )
                        event.target.value = ''
                        setFile(null)
                        return
                      }
                      setFile(selected)
                      setComposerError('')
                      setProgress(0)
                    }}
                  />
                </label>
                <span>
                  {spaceId
                    ? 'Bài của thành viên cần quản trị viên duyệt trước khi hiển thị.'
                    : 'Chia sẻ câu hỏi, tài liệu hoặc kinh nghiệm học tập'}
                </span>
                <button
                  className="community-primary"
                  disabled={submitting || (!body.trim() && !file)}
                >
                  {submitting ? 'Đang đăng…' : 'Đăng bài'}
                </button>
              </div>
              {file && (
                <div className="community-upload-status" role="status">
                  <span>
                    {file.name} · {(file.size / 1_000_000).toFixed(2)} MB
                  </span>
                  {submitting ? (
                    <progress
                      value={progress}
                      max={100}
                      aria-label="Tiến độ tải media"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        if (fileInput.current) fileInput.current.value = ''
                      }}
                    >
                      Bỏ file
                    </button>
                  )}
                </div>
              )}
              {composerError && (
                <p className="community-error" role="alert">
                  {composerError}
                </p>
              )}
            </div>
          </form>
        ) : (
          <div className="community-card community-guest-cta">
            <strong>Chia sẻ điều bạn đang học.</strong>
            <span>Đăng nhập để đăng bài, bình luận và tham gia cộng đồng.</span>
            <Link
              className="community-primary"
              to="/login"
              state={{ from: spaceId ? `/community/spaces/${spaceId}` : '/' }}
            >
              Đăng nhập
            </Link>
          </div>
        ))}
      {notice && (
        <p className="community-inline-note" role="status">
          {notice}
        </p>
      )}
      {error && !loading && posts.length > 0 && (
        <p className="community-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="community-muted">Đang tải bảng tin…</p>
      ) : error && posts.length === 0 ? (
        <div className="community-card community-unavailable" role="alert">
          <strong>Chưa tải được bảng tin</strong>
          <p>{error}</p>
          <button
            className="community-more"
            onClick={() => {
              setLoading(true)
              void load()
            }}
          >
            Thử lại
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="community-card community-empty">
          <strong>Chưa có bài viết nào.</strong>
          <p>Hãy bắt đầu một cuộc trò chuyện về điều bạn đang học.</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            canInteract={canInteract}
            canModerate={canModerate}
            onChange={(updated) =>
              setPosts((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              )
            }
            onRemove={() =>
              setPosts((current) =>
                current.filter((item) => item.id !== post.id),
              )
            }
            onShare={(shared) => setPosts((current) => [shared, ...current])}
          />
        ))
      )}
      <div ref={sentinel} aria-hidden="true" />
      {moreLoading && <p className="community-muted">Đang tải thêm…</p>}
      {cursor && !moreLoading && (
        <button
          className="community-more"
          onClick={() => {
            setMoreLoading(true)
            void load(cursor)
          }}
        >
          Xem thêm bài viết
        </button>
      )}
    </section>
  )
}
