import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCommunityApi } from './useCommunityApi'
import type { Comment, FeedPage, Post } from './types'

const date = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export function CommunityFeed({
  spaceId,
  canPost = true,
  canInteract = true,
}: {
  spaceId?: string
  canPost?: boolean
  canInteract?: boolean
}) {
  const { user } = useAuth()
  const { read, write } = useCommunityApi()
  const [posts, setPosts] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [autoLoadFailed, setAutoLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  const load = useCallback(
    async (next?: string) => {
      const params = new URLSearchParams({ size: '12' })
      if (spaceId) params.set('spaceId', spaceId)
      if (next) params.set('cursor', next)
      try {
        const page = await read<FeedPage>(`/community/feed?${params}`)
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
        if (next) setAutoLoadFailed(true)
        setError(
          cause instanceof Error ? cause.message : 'Không tải được bảng tin.',
        )
      } finally {
        setLoading(false)
        setMoreLoading(false)
      }
    },
    [read, spaceId],
  )

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])
  useEffect(() => {
    if (
      !cursor ||
      !sentinel.current ||
      loading ||
      moreLoading ||
      autoLoadFailed
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
    if (!body.trim() || submitting) return
    setSubmitting(true)
    try {
      const post = await write<Post>('/community/posts', 'POST', {
        body: body.trim(),
        spaceId: spaceId ?? null,
        sharedPostId: null,
      })
      setPosts((current) => [post, ...current])
      setBody('')
      setError('')
    } catch (cause) {
      setError(
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
              />
              <div className="community-composer-footer">
                <span>Chia sẻ câu hỏi, tài liệu hoặc kinh nghiệm học tập</span>
                <button
                  className="community-primary"
                  disabled={submitting || !body.trim()}
                >
                  {submitting ? 'Đang đăng…' : 'Đăng bài'}
                </button>
              </div>
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
      {error && posts.length > 0 && (
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

function PostCard({
  post,
  canInteract,
  onChange,
  onRemove,
  onShare,
}: {
  post: Post
  canInteract: boolean
  onChange: (post: Post) => void
  onRemove: () => void
  onShare: (post: Post) => void
}) {
  const { user } = useAuth()
  const { read, write } = useCommunityApi()
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [commentPage, setCommentPage] = useState(0)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareBody, setShareBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const requireLogin = !user
  const toggleLike = async () => {
    if (busy || requireLogin || !canInteract) return
    setBusy(true)
    try {
      onChange(
        await write<Post>(
          `/community/posts/${post.id}/likes`,
          post.likedByViewer ? 'DELETE' : 'POST',
        ),
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không thể thích bài viết.',
      )
    } finally {
      setBusy(false)
    }
  }
  const openComments = async () => {
    if (comments) {
      setComments(null)
      return
    }
    try {
      const firstPage = await read<Comment[]>(
        `/community/posts/${post.id}/comments`,
      )
      setComments(firstPage)
      setCommentPage(0)
      setHasMoreComments(firstPage.length === 50)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không tải được bình luận.',
      )
    }
  }
  const loadMoreComments = async () => {
    const next = commentPage + 1
    try {
      const page = await read<Comment[]>(
        `/community/posts/${post.id}/comments?page=${next}`,
      )
      setComments((current) => [...(current ?? []), ...page])
      setCommentPage(next)
      setHasMoreComments(page.length === 50)
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không tải được bình luận.',
      )
    }
  }
  const comment = async (event: FormEvent) => {
    event.preventDefault()
    if (!commentBody.trim() || busy || !canInteract) return
    setBusy(true)
    try {
      const created = await write<Comment>(
        `/community/posts/${post.id}/comments`,
        'POST',
        { body: commentBody.trim(), parentId: replyTo },
      )
      setComments((current) => [...(current ?? []), created])
      onChange({ ...post, commentCount: post.commentCount + 1 })
      setCommentBody('')
      setReplyTo(null)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể bình luận.')
    } finally {
      setBusy(false)
    }
  }
  const share = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      const shared = await write<Post>('/community/posts', 'POST', {
        body: shareBody.trim(),
        sharedPostId: post.id,
        spaceId: null,
      })
      onShare(shared)
      onChange({ ...post, shareCount: post.shareCount + 1 })
      setShareOpen(false)
      setShareBody('')
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể chia sẻ.')
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    if (!window.confirm('Xóa bài viết này?')) return
    try {
      await write<void>(`/community/posts/${post.id}`, 'DELETE')
      onRemove()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không thể xóa bài viết.',
      )
    }
  }
  return (
    <article className="community-card community-post">
      <div className="community-post-head">
        <div className="community-avatar">
          {post.authorName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <strong>{post.authorName}</strong>
          <p>
            {post.spaceId ? (
              <>
                <Link to={`/community/spaces/${post.spaceId}`}>
                  {post.spaceName}
                </Link>{' '}
                ·{' '}
              </>
            ) : null}
            <time dateTime={post.createdAt}>{date(post.createdAt)}</time>
          </p>
        </div>
        {user?.id === post.authorId && (
          <button
            className="community-post-delete"
            onClick={() => void remove()}
            aria-label="Xóa bài viết"
          >
            ×
          </button>
        )}
      </div>
      {post.body && <p className="community-post-body">{post.body}</p>}
      {post.sharedPostId && (
        <div className="community-shared">
          <strong>{post.sharedAuthorName}</strong>
          <p>{post.sharedBody}</p>
        </div>
      )}
      <div className="community-counts">
        <span>{post.likeCount} lượt thích</span>
        <span>
          {post.commentCount} bình luận · {post.shareCount} chia sẻ
        </span>
      </div>
      <div className="community-actions">
        <button
          disabled={busy || requireLogin || !canInteract}
          onClick={() => void toggleLike()}
          aria-pressed={post.likedByViewer}
        >
          {post.likedByViewer ? '♥ Đã thích' : '♡ Thích'}
        </button>
        <button onClick={() => void openComments()}>▤ Bình luận</button>
        <button
          disabled={!post.shareable || requireLogin}
          onClick={() => setShareOpen(!shareOpen)}
        >
          ↗ Chia sẻ
        </button>
      </div>
      {requireLogin && (
        <p className="community-inline-note">
          <Link to="/login" state={{ from: '/' }}>
            Đăng nhập
          </Link>{' '}
          để tương tác.
        </p>
      )}
      {!requireLogin && !canInteract && (
        <p className="community-inline-note">
          Tham gia nhóm để thích hoặc bình luận bài viết.
        </p>
      )}
      {shareOpen && (
        <form
          className="community-inline-form"
          onSubmit={(event) => void share(event)}
        >
          <label htmlFor={`share-${post.id}`}>Chia sẻ lên trang cá nhân</label>
          <textarea
            id={`share-${post.id}`}
            maxLength={5000}
            value={shareBody}
            onChange={(event) => setShareBody(event.target.value)}
            placeholder="Thêm lời giới thiệu (không bắt buộc)"
          />
          <button className="community-primary" disabled={busy}>
            Đăng chia sẻ
          </button>
        </form>
      )}
      {comments && (
        <div className="community-comments">
          <strong>Bình luận</strong>
          {comments.length === 0 && (
            <p className="community-muted">Chưa có bình luận.</p>
          )}
          {comments.map((item) => (
            <div
              className={
                'community-comment ' + (item.parentId ? 'is-reply' : '')
              }
              key={item.id}
            >
              <div className="community-avatar">
                {item.authorName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong>{item.authorName}</strong>
                <time dateTime={item.createdAt}>{date(item.createdAt)}</time>
                <p>{item.removed ? 'Bình luận đã được xóa' : item.body}</p>
                {user && canInteract && !item.removed && !item.parentId && (
                  <button onClick={() => setReplyTo(item.id)}>Trả lời</button>
                )}
                {user?.id === item.authorId && !item.removed && (
                  <button
                    onClick={async () => {
                      try {
                        await write<void>(
                          `/community/comments/${item.id}`,
                          'DELETE',
                        )
                        setComments(
                          (current) =>
                            current?.map((comment) =>
                              comment.id === item.id
                                ? { ...comment, removed: true }
                                : comment,
                            ) ?? null,
                        )
                      } catch (cause) {
                        setError(
                          cause instanceof Error
                            ? cause.message
                            : 'Không thể xóa bình luận.',
                        )
                      }
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
          {hasMoreComments && (
            <button
              className="community-more"
              onClick={() => void loadMoreComments()}
            >
              Xem thêm bình luận
            </button>
          )}
          {user && canInteract && (
            <form
              className="community-inline-form"
              onSubmit={(event) => void comment(event)}
            >
              {replyTo && (
                <p>
                  Đang trả lời bình luận{' '}
                  <button type="button" onClick={() => setReplyTo(null)}>
                    Hủy
                  </button>
                </p>
              )}
              <label className="sr-only" htmlFor={`comment-${post.id}`}>
                Viết bình luận
              </label>
              <input
                id={`comment-${post.id}`}
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                maxLength={2000}
                placeholder="Viết bình luận…"
              />
              <button
                className="community-primary"
                disabled={busy || !commentBody.trim()}
              >
                Gửi
              </button>
            </form>
          )}
        </div>
      )}
      {error && (
        <p className="community-error" role="alert">
          {error}
        </p>
      )}
    </article>
  )
}
