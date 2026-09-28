import { useCallback, useEffect, useState } from 'react'
import { useCommunityApi } from './useCommunityApi'
import type { Post } from './types'
import { PostMedia } from './PostMedia'

export function SpacePostModeration({
  spaceId,
  onPublished,
}: {
  spaceId: string
  onPublished: () => void
}) {
  const { read, write } = useCommunityApi()
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await read<Post[]>(
        `/community/spaces/${spaceId}/posts/pending?page=${page}`,
      )
      setPosts(rows)
      setHasMore(rows.length === 20)
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không tải được hàng đợi duyệt.',
      )
    } finally {
      setLoading(false)
    }
  }, [read, spaceId, page])
  useEffect(() => {
    void load()
  }, [load])
  const decide = async (id: string, approve: boolean) => {
    if (busy) return
    setBusy(id)
    try {
      await write<Post>(
        `/community/spaces/${spaceId}/posts/${id}/${approve ? 'approve' : 'reject'}`,
        'POST',
      )
      if (approve) onPublished()
      await load()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không thể xử lý bài viết.',
      )
    } finally {
      setBusy(null)
    }
  }
  return (
    <section
      className="community-card community-review"
      aria-label="Duyệt bài viết"
    >
      <h2>Bài viết chờ duyệt</h2>
      <p className="community-muted">
        Chỉ quản trị viên của cộng đồng này được duyệt bài.
      </p>
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Đang tải…</p>
      ) : posts.length === 0 ? (
        <p>Không có bài chờ duyệt ở trang này.</p>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="community-review-item">
            <strong>{post.authorName}</strong>
            {post.media && <PostMedia postId={post.id} media={post.media} />}
            <p className="community-post-body">{post.body}</p>
            <div className="community-form-actions">
              <button
                disabled={!!busy}
                onClick={() => void decide(post.id, false)}
              >
                Từ chối
              </button>
              <button
                disabled={!!busy}
                className="community-primary"
                onClick={() => void decide(post.id, true)}
              >
                Duyệt bài
              </button>
            </div>
          </article>
        ))
      )}
      <div className="community-form-actions">
        <button
          disabled={loading || !!busy || page === 0}
          onClick={() => setPage((current) => current - 1)}
        >
          Trang trước
        </button>
        <button
          disabled={loading || !!busy || !hasMore}
          onClick={() => setPage((current) => current + 1)}
        >
          Trang sau
        </button>
        <button disabled={loading || !!busy} onClick={() => void load()}>
          Tải lại
        </button>
      </div>
    </section>
  )
}
