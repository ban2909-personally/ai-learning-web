import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CommunityFeed } from './CommunityFeed'
import { useCommunityApi } from './useCommunityApi'
import type { PublicProfile } from './types'

export function PublicProfilePage() {
  const { id } = useParams()
  const { read } = useCommunityApi()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setProfile(null)
    setError('')
    void read<PublicProfile>(`/community/people/${id}`, {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) setProfile(value)
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : 'Không tìm thấy hồ sơ.',
          )
      })
    return () => controller.abort()
  }, [id, read, retry])
  return (
    <main className="community-profile-page">
      <Link to="/">← Về bảng tin</Link>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            className="community-more"
            onClick={() => setRetry((value) => value + 1)}
          >
            Thử lại
          </button>
        </div>
      ) : !profile ? (
        <p role="status">Đang mở hồ sơ…</p>
      ) : (
        <>
          <section className="community-profile-hero">
            <span className="account-avatar" aria-hidden="true">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <small>HỒ SƠ CÔNG KHAI</small>
              <h1>{profile.displayName}</h1>
              <p>Bài viết cá nhân và chia sẻ trong cộng đồng công khai.</p>
            </div>
          </section>
          <CommunityFeed
            key={profile.id}
            authorId={profile.id}
            canPost={false}
          />
        </>
      )}
    </main>
  )
}
