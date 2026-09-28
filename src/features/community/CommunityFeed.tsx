import { useCallback, useEffect, useRef, useState } from 'react'
import { useCommunityApi } from './useCommunityApi'
import { PostCard } from './PostCard'
import { PostComposer } from './PostComposer'
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
  const { read } = useCommunityApi()
  const [posts, setPosts] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [autoLoadFailed, setAutoLoadFailed] = useState(false)
  const [error, setError] = useState('')
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

  return (
    <section className="community-feed" aria-label="Bảng tin cộng đồng">
      {canPost && (
        <PostComposer
          spaceId={spaceId}
          onPublished={(post) => setPosts((current) => [post, ...current])}
        />
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
