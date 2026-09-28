import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCommunityApi } from './useCommunityApi'
import { PostMedia } from './PostMedia'
import { PostPoll } from './PostPoll'
import { CommunityIcon } from './CommunityIcon'
import { PostReactions, ReactionSummary } from './PostReactions'
import type { Comment, Post } from './types'
const date = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export function PostCard({
  post,
  canInteract,
  canModerate,
  onChange,
  onRemove,
  onShare,
}: {
  post: Post
  canInteract: boolean
  canModerate: boolean
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
  useEffect(() => {
    if (!post.mediaExpiresAt) return
    const delay = new Date(post.mediaExpiresAt).getTime() - Date.now()
    if (delay <= 0) {
      onRemove()
      return
    }
    const timer = setTimeout(onRemove, Math.min(delay, 2_147_483_647))
    return () => clearTimeout(timer)
  }, [post.mediaExpiresAt, onRemove])
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
          {post.spaceId && (
            <Link
              className="community-post-space"
              to={`/community/spaces/${post.spaceId}`}
            >
              {post.spaceName}
            </Link>
          )}
          <strong>{post.authorName}</strong>
          <p>
            <time dateTime={post.createdAt}>{date(post.createdAt)}</time>
          </p>
        </div>
        {user && (user.id === post.authorId || canModerate) && (
          <button
            className="community-post-delete"
            onClick={() => void remove()}
            aria-label="Xóa bài viết"
          >
            ×
          </button>
        )}
      </div>
      {post.body &&
        (post.body !== post.poll?.question ||
          post.appearance?.backgroundColor) && (
          <p
            className={
              'community-post-body' +
              (post.appearance?.backgroundColor ? ' has-custom-colors' : '')
            }
            style={
              post.appearance?.backgroundColor
                ? {
                    backgroundColor: post.appearance.backgroundColor,
                    color: post.appearance.fontColor ?? undefined,
                  }
                : undefined
            }
          >
            {post.body}
          </p>
        )}
      {post.appearance?.attachmentUrl && (
        <a
          className="community-post-link"
          href={post.appearance.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <CommunityIcon name="link" />
          <span>
            Link đính kèm
            <small>{new URL(post.appearance.attachmentUrl).hostname}</small>
          </span>
          <CommunityIcon name="share" />
        </a>
      )}
      {post.poll && (
        <PostPoll
          post={post}
          canInteract={canInteract}
          canModerate={canModerate}
          onChange={onChange}
        />
      )}
      {post.media && <PostMedia postId={post.id} media={post.media} />}
      {post.mediaExpiresAt && (
        <small className="community-media-expiry">
          Media/bài viết hết hạn:{' '}
          {new Date(post.mediaExpiresAt).toLocaleString('vi-VN')}
        </small>
      )}
      {post.sharedPostId && (
        <div className="community-shared">
          <strong>{post.sharedAuthorName}</strong>
          <p>{post.sharedBody}</p>
          {post.sharedMedia && (
            <PostMedia postId={post.sharedPostId} media={post.sharedMedia} />
          )}
        </div>
      )}
      <div className="community-counts">
        <ReactionSummary post={post} />
        <span>
          {post.commentCount} bình luận · {post.shareCount} chia sẻ
        </span>
      </div>
      <div className="community-actions">
        <PostReactions
          post={post}
          canInteract={canInteract}
          onChange={onChange}
        />
        <button onClick={() => void openComments()}>
          <CommunityIcon name="comment" /> Bình luận
        </button>
        <button
          disabled={!post.shareable || requireLogin}
          onClick={() => setShareOpen(!shareOpen)}
        >
          <CommunityIcon name="share" /> Chia sẻ
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
      {!comments && (post.commentPreview ?? []).length > 0 && (
        <div
          className="community-comment-preview"
          aria-label="Bình luận xem trước"
        >
          {post.commentPreview!.map((item) => (
            <div className="community-comment" key={item.id}>
              <div className="community-avatar">
                {item.authorName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong>{item.authorName}</strong>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
          <button
            className="community-more"
            onClick={() => void openComments()}
          >
            Xem cuộc thảo luận
          </button>
        </div>
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
                {user &&
                  (user.id === item.authorId ||
                    user.id === post.authorId ||
                    canModerate) &&
                  !item.removed && (
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
                          onChange({
                            ...post,
                            commentCount: Math.max(0, post.commentCount - 1),
                            commentPreview: (post.commentPreview ?? []).filter(
                              (preview) => preview.id !== item.id,
                            ),
                          })
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
