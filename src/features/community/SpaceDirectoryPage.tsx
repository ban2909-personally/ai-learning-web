import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCommunityApi } from './useCommunityApi'
import { CommunityIcon } from './CommunityIcon'
import type { Space } from './types'

export function SpaceDirectoryPage() {
  const { user } = useAuth()
  const { read, write } = useCommunityApi()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [kind, setKind] = useState<'ALL' | 'GROUP' | 'PAGE'>('ALL')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [newKind, setNewKind] = useState<'GROUP' | 'PAGE'>('GROUP')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  useEffect(() => {
    let active = true
    setLoading(true)
    void read<Space[]>(
      `/community/spaces?search=${encodeURIComponent(search)}&page=${page}`,
    )
      .then((result) => {
        if (!active) return
        setSpaces((current) =>
          page === 0
            ? result
            : [
                ...current,
                ...result.filter(
                  (space) => !current.some((item) => item.id === space.id),
                ),
              ],
        )
        setHasMore(result.length === 20)
        setError('')
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Không tải được không gian.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, read, search])
  const create = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const space = await write<Space>('/community/spaces', 'POST', {
        name: name.trim(),
        description: description.trim(),
        kind: newKind,
        visibility: newKind === 'PAGE' ? 'PUBLIC' : visibility,
      })
      setSpaces((current) => [space, ...current])
      setCreating(false)
      setName('')
      setDescription('')
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không thể tạo không gian.',
      )
    }
  }
  const filtered = spaces.filter(
    (space) => kind === 'ALL' || space.kind === kind,
  )
  return (
    <main className="community-directory">
      <div className="community-page-head">
        <div>
          <Link to="/" className="community-back">
            ← Bảng tin
          </Link>
          <span className="community-eyebrow">HỌC CÙNG CỘNG ĐỒNG</span>
          <h1>Hội nhóm & trang</h1>
          <p>Tìm một nơi để cùng hỏi, cùng giải đáp và chia sẻ tri thức.</p>
        </div>
        {user ? (
          <button
            className="community-primary"
            onClick={() => setCreating(!creating)}
          >
            + Tạo nhóm / trang
          </button>
        ) : (
          <Link
            className="community-primary"
            to="/login"
            state={{ from: '/community/spaces' }}
          >
            Đăng nhập để tạo
          </Link>
        )}
      </div>
      {creating && (
        <form
          className="community-card community-create-form"
          onSubmit={(event) => void create(event)}
        >
          <h2>Tạo không gian mới</h2>
          <label>
            Tên nhóm hoặc trang
            <input
              required
              minLength={3}
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Giới thiệu
            <textarea
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div className="community-form-row">
            <label>
              Loại
              <select
                value={newKind}
                onChange={(event) =>
                  setNewKind(event.target.value as 'GROUP' | 'PAGE')
                }
              >
                <option value="GROUP">Hội nhóm</option>
                <option value="PAGE">Trang</option>
              </select>
            </label>
            {newKind === 'GROUP' && (
              <label>
                Quyền xem
                <select
                  value={visibility}
                  onChange={(event) =>
                    setVisibility(event.target.value as 'PUBLIC' | 'PRIVATE')
                  }
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </label>
            )}
          </div>
          <div className="community-form-actions">
            <button type="button" onClick={() => setCreating(false)}>
              Hủy
            </button>
            <button className="community-primary">Tạo không gian</button>
          </div>
        </form>
      )}
      <form
        className="community-search"
        onSubmit={(event) => {
          event.preventDefault()
          if (query !== search) {
            setSpaces([])
            setPage(0)
            setSearch(query)
          }
        }}
      >
        <input
          aria-label="Tìm hội nhóm hoặc trang"
          placeholder="Tìm theo tên không gian…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button>Tìm kiếm</button>
      </form>
      <div
        className="community-tabs"
        role="group"
        aria-label="Lọc loại không gian"
      >
        {(['ALL', 'GROUP', 'PAGE'] as const).map((item) => (
          <button
            key={item}
            className={kind === item ? 'selected' : ''}
            onClick={() => setKind(item)}
          >
            {item === 'ALL'
              ? 'Tất cả'
              : item === 'GROUP'
                ? 'Hội nhóm'
                : 'Trang'}
          </button>
        ))}
      </div>
      {error && (
        <p className="community-error" role="alert">
          {error}
        </p>
      )}
      <div className="community-space-grid">
        {filtered.map((space) => (
          <Link
            to={`/community/spaces/${space.id}`}
            key={space.id}
            className="community-card community-space-card"
          >
            <span className="community-space-icon">
              <CommunityIcon
                name={space.kind === 'GROUP' ? 'spaces' : 'page'}
              />
            </span>
            <small>
              {space.kind === 'GROUP' ? 'HỘI NHÓM' : 'TRANG'} ·{' '}
              {space.visibility === 'PRIVATE' ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
            </small>
            <h2>{space.name}</h2>
            <p>{space.description || 'Cùng nhau chia sẻ tri thức.'}</p>
            <span>
              {space.memberCount} thành viên <b>Khám phá →</b>
            </span>
          </Link>
        ))}
      </div>
      {loading && <p className="community-muted">Đang tải không gian…</p>}
      {hasMore && !loading && (
        <button
          className="community-more"
          onClick={() => setPage((current) => current + 1)}
        >
          Xem thêm nhóm & trang
        </button>
      )}
      {filtered.length === 0 && !loading && !hasMore && !error && (
        <p className="community-muted">
          Chưa có không gian phù hợp. Bạn có thể tạo một không gian mới.
        </p>
      )}
    </main>
  )
}
