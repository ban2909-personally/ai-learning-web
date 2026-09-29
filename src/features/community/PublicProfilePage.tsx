import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { CommunityFeed } from './CommunityFeed'
import { CommunityIcon } from './CommunityIcon'
import { FriendshipActions } from './FriendshipActions'
import { ProfileEditor } from './ProfileEditor'
import { useCommunityApi } from './useCommunityApi'
import type { SocialProfile } from './types'

export function PublicProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { read } = useCommunityApi()
  const [view, setView] = useState<SocialProfile | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [tab, setTab] = useState<'posts' | 'about'>('posts')
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setView(null)
    setError('')
    setEditing(false)
    setTab('posts')
    void read<SocialProfile>(`/community/people/${id}/profile`, {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) setView(value)
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : 'Không tìm thấy hồ sơ.',
          )
      })
    return () => controller.abort()
  }, [id, user?.id, read, retry])
  const profile = view?.profile
  const own = profile?.id === user?.id
  return (
    <main className="social-profile-page">
      <Link className="social-profile-back" to="/">
        ← Về bảng tin
      </Link>
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
      ) : !profile || !view ? (
        <p role="status">Đang mở hồ sơ…</p>
      ) : (
        <>
          <section className="social-profile-header">
            <div
              className={`social-profile-cover social-cover-${profile.coverTheme}`}
              aria-label="Ảnh bìa theo phong cách cá nhân"
            >
              <span>CONNECT. SHARE. GROW.</span>
              <i />
              <i />
              <i />
            </div>
            <div className="social-profile-identity">
              <span className="social-profile-avatar" aria-hidden="true">
                {profile.displayName.slice(0, 1).toUpperCase()}
              </span>
              <div className="social-profile-name">
                <small>KHÔNG GIAN CÁ NHÂN</small>
                <h1>{profile.displayName}</h1>
                <p>
                  {view.friendship.friendCount} người bạn
                  {!own && user && (
                    <> · {view.friendship.mutualFriendCount} bạn chung</>
                  )}
                </p>
                {profile.bio && (
                  <p className="social-profile-bio">{profile.bio}</p>
                )}
                {profile.location && (
                  <p>
                    <CommunityIcon name="feed" />
                    {profile.location}
                  </p>
                )}
              </div>
              {own ? (
                <div className="social-profile-actions">
                  <button
                    className="community-primary"
                    onClick={() => setEditing((value) => !value)}
                  >
                    Chỉnh sửa hồ sơ
                  </button>
                  <Link className="community-more" to="/community/friends">
                    Bạn bè & lời mời
                  </Link>
                </div>
              ) : (
                <FriendshipActions
                  key={profile.id}
                  person={profile}
                  relationship={view.friendship.relationship}
                  onChange={(friendship) =>
                    setView((current) =>
                      current?.profile.id === profile.id
                        ? { ...current, friendship }
                        : current,
                    )
                  }
                />
              )}
            </div>
            <nav className="social-profile-tabs" aria-label="Nội dung hồ sơ">
              <button
                aria-pressed={tab === 'posts'}
                onClick={() => setTab('posts')}
              >
                Bài viết
              </button>
              <button
                aria-pressed={tab === 'about'}
                onClick={() => setTab('about')}
              >
                Giới thiệu
              </button>
              {own && <Link to="/community/friends">Bạn bè</Link>}
            </nav>
          </section>
          {editing && own && (
            <ProfileEditor
              profile={profile}
              onCancel={() => setEditing(false)}
              onSaved={(result) => {
                setView((current) =>
                  current?.profile.id === result.profile.id ? result : current,
                )
                setEditing(false)
              }}
            />
          )}
          <div
            className={
              'social-profile-content' + (tab === 'about' ? ' is-about' : '')
            }
          >
            <aside className="social-profile-intro">
              <h2>Giới thiệu</h2>
              <p className="social-profile-bio">
                {profile.bio ||
                  'Chưa có phần giới thiệu. Những kết nối mới bắt đầu từ một lời chào.'}
              </p>
              {profile.location && (
                <p>
                  <CommunityIcon name="feed" />
                  Sống tại {profile.location}
                </p>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CommunityIcon name="link" />
                  Website cá nhân ↗
                </a>
              )}
              <div className="social-profile-count">
                <CommunityIcon name="spaces" />
                <strong>{view.friendship.friendCount}</strong> bạn bè
              </div>
              <small>
                Hồ sơ chỉ hiển thị bài viết cá nhân và cộng đồng công khai. Lời
                mời và danh sách bạn bè chỉ dành cho chủ tài khoản.
              </small>
            </aside>
            {tab === 'posts' && (
              <section className="social-profile-posts">
                <h2>Bài viết</h2>
                <CommunityFeed
                  key={profile.id}
                  authorId={profile.id}
                  canPost={false}
                />
              </section>
            )}
          </div>
        </>
      )}
    </main>
  )
}
