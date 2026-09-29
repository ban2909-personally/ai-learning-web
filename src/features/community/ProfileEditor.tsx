import { useState, type FormEvent } from 'react'
import { useCommunityApi } from './useCommunityApi'
import type { SocialProfile } from './types'

export function ProfileEditor({
  profile,
  onSaved,
  onCancel,
}: {
  profile: SocialProfile['profile']
  onSaved: (result: SocialProfile) => void
  onCancel: () => void
}) {
  const { write } = useCommunityApi()
  const [draft, setDraft] = useState({
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    coverTheme: profile.coverTheme,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      onSaved(await write<SocialProfile>('/community/profile', 'PUT', draft))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được hồ sơ.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form
      className="social-profile-editor"
      onSubmit={(event) => void save(event)}
    >
      <h2>Chỉnh sửa hồ sơ công khai</h2>
      <p>Chỉ chia sẻ thông tin bạn muốn mọi người trên nền tảng nhìn thấy.</p>
      <fieldset disabled={busy}>
        <label>
          Giới thiệu
          <textarea
            rows={4}
            maxLength={400}
            value={draft.bio}
            onChange={(event) =>
              setDraft({ ...draft, bio: event.target.value })
            }
            placeholder="Một chút về bạn và những điều bạn yêu thích…"
          />
        </label>
        <label>
          Nơi sống
          <input
            maxLength={120}
            value={draft.location}
            onChange={(event) =>
              setDraft({ ...draft, location: event.target.value })
            }
            placeholder="Không bắt buộc"
          />
        </label>
        <label>
          Website
          <input
            type="url"
            maxLength={500}
            value={draft.website}
            onChange={(event) =>
              setDraft({ ...draft, website: event.target.value })
            }
            placeholder="https://…"
          />
        </label>
        <label>
          Phong cách ảnh bìa
          <select
            value={draft.coverTheme}
            onChange={(event) =>
              setDraft({
                ...draft,
                coverTheme: event.target
                  .value as SocialProfile['profile']['coverTheme'],
              })
            }
          >
            <option value="aurora">Aurora · Tím xanh</option>
            <option value="ocean">Ocean · Đại dương</option>
            <option value="sunset">Sunset · Hoàng hôn</option>
            <option value="forest">Forest · Thiên nhiên</option>
          </select>
        </label>
        <div className="social-profile-actions">
          <button className="community-primary">Lưu thay đổi</button>
          <button type="button" className="community-more" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </fieldset>
      {busy && <p role="status">Đang lưu…</p>}
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
    </form>
  )
}
