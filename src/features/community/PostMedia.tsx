import { useEffect, useRef, useState } from 'react'
import { resolveApiUrl } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import type { CommunityMedia } from './types'

export function PostMedia({
  postId,
  media,
}: {
  postId: string
  media: CommunityMedia
}) {
  const { user, getAccessToken } = useAuth()
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!container.current || visible) return
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [visible])
  useEffect(() => {
    if (!visible) return
    let active = true
    setError(false)
    setSrc(null)
    const load = async () => {
      try {
        if (user) await getAccessToken()
        if (active)
          setSrc(resolveApiUrl(`/api/v1/media/community/posts/${postId}`))
      } catch {
        if (active) setError(true)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [visible, postId, getAccessToken, user, attempt])
  const video = media.contentType.startsWith('video/')
  return (
    <div className="community-post-media" ref={container}>
      {error ? (
        <div className="community-media-placeholder" role="alert">
          <p>Không tải được media hoặc quyền xem đã thay đổi.</p>
          <button onClick={() => setAttempt((value) => value + 1)}>
            Thử lại media
          </button>
        </div>
      ) : src ? (
        video ? (
          <video
            src={src}
            controls
            playsInline
            preload="none"
            crossOrigin="use-credentials"
            aria-label="Video bài viết"
            onError={() => setError(true)}
          />
        ) : (
          <img
            src={src}
            loading="lazy"
            decoding="async"
            crossOrigin="use-credentials"
            alt="Ảnh được chia sẻ trong bài viết"
            onError={() => setError(true)}
          />
        )
      ) : (
        <button
          type="button"
          className="community-media-placeholder"
          onClick={() => setVisible(true)}
        >
          {video ? '▶ Video' : '▧ Ảnh'} · Tải khi xem
        </button>
      )}
    </div>
  )
}
