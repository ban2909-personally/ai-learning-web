import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { CommunityFeed } from './CommunityFeed'
import { useCommunityApi } from './useCommunityApi'
import type { Member, Space } from './types'

export function SpaceDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { read, write } = useCommunityApi()
  const [space, setSpace] = useState<Space | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [memberPage, setMemberPage] = useState(0)
  const [moreMembers, setMoreMembers] = useState(false)
  const [memberLoading, setMemberLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const manager =
    space?.myStatus === 'ACTIVE' &&
    (space.myRole === 'OWNER' || space.myRole === 'ADMIN')
  const canPost =
    space?.myStatus === 'ACTIVE' && (space.kind === 'GROUP' || manager)
  const refresh = useCallback(async () => {
    if (!id) return
    try {
      setSpace(await read<Space>(`/community/spaces/${id}`))
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không tìm thấy không gian.',
      )
    } finally {
      setLoading(false)
    }
  }, [id, read])
  useEffect(() => {
    void refresh()
  }, [refresh])
  const loadMembers = useCallback(
    async (page: number) => {
      if (!id) return
      setMemberLoading(true)
      try {
        const result = await read<Member[]>(
          `/community/spaces/${id}/members?page=${page}`,
        )
        setMembers((current) =>
          page === 0
            ? result
            : [
                ...current,
                ...result.filter(
                  (member) =>
                    !current.some((item) => item.userId === member.userId),
                ),
              ],
        )
        setMoreMembers(result.length === 50)
        setMemberPage(page)
      } finally {
        setMemberLoading(false)
      }
    },
    [id, read],
  )
  useEffect(() => {
    if (manager)
      void loadMembers(0).catch((cause) => {
        setMembers([])
        setError(
          cause instanceof Error ? cause.message : 'Không tải được hội viên.',
        )
      })
    else {
      setMembers([])
      setMoreMembers(false)
    }
  }, [loadMembers, manager])
  const action = async (path: string, method = 'POST', body?: unknown) => {
    if (!id) return
    try {
      setSpace(
        await write<Space>(`/community/spaces/${id}${path}`, method, body),
      )
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Thao tác không thành công.',
      )
    }
  }
  const moderate = async (
    member: Member,
    operation: 'approve' | 'reject' | 'remove' | 'promote' | 'demote',
  ) => {
    if (!id) return
    const path = `/community/spaces/${id}/members/${member.userId}`
    try {
      const updated =
        operation === 'remove'
          ? await write<Space>(path, 'DELETE')
          : operation === 'promote' || operation === 'demote'
            ? await write<Space>(`${path}/role`, 'PATCH', {
                role: operation === 'promote' ? 'ADMIN' : 'MEMBER',
              })
            : await write<Space>(`${path}/${operation}`, 'POST')
      setSpace(updated)
      await loadMembers(0)
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không thể thay đổi thành viên.',
      )
    }
  }
  const invite = async (event: FormEvent) => {
    event.preventDefault()
    if (!id || !inviteEmail.trim()) return
    try {
      setSpace(
        await write<Space>(`/community/spaces/${id}/invite`, 'POST', {
          email: inviteEmail.trim(),
        }),
      )
      setInviteEmail('')
      await loadMembers(0)
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không thể mời thành viên.',
      )
    }
  }
  if (loading)
    return (
      <main className="community-directory">
        <p>Đang tải không gian…</p>
      </main>
    )
  if (!space)
    return (
      <main className="community-directory">
        <Link to="/community/spaces">← Hội nhóm & trang</Link>
        <p className="community-error">{error}</p>
      </main>
    )
  return (
    <main className="community-directory">
      <Link to="/community/spaces" className="community-back">
        ← Hội nhóm & trang
      </Link>
      <div className="community-space-cover">
        <span>{space.kind === 'GROUP' ? '♧' : '▣'}</span>
        <div>
          <small>
            {space.kind === 'GROUP' ? 'HỘI NHÓM' : 'TRANG'} ·{' '}
            {space.visibility === 'PRIVATE' ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
          </small>
          <h1>{space.name}</h1>
          <p>{space.description || 'Nơi chia sẻ kiến thức cùng cộng đồng.'}</p>
          <div className="community-cover-meta">
            {space.memberCount} thành viên · Tạo bởi {space.ownerName}
          </div>
        </div>
      </div>
      <div className="community-space-toolbar">
        <div>
          {space.myRole ? (
            <strong>
              Vai trò của bạn:{' '}
              {space.myRole === 'OWNER'
                ? 'Người sáng lập'
                : space.myRole === 'ADMIN'
                  ? 'Quản trị viên'
                  : 'Thành viên'}
            </strong>
          ) : (
            <strong>Tham gia để cùng chia sẻ</strong>
          )}
        </div>
        {user ? (
          !space.myStatus ? (
            <button
              className="community-primary"
              onClick={() => void action('/join')}
            >
              {space.visibility === 'PRIVATE' ? 'Yêu cầu tham gia' : 'Tham gia'}
            </button>
          ) : space.myStatus === 'PENDING' ? (
            <span className="community-pill">Đang chờ duyệt</span>
          ) : space.myStatus === 'INVITED' ? (
            <>
              <button
                className="community-primary"
                onClick={() => void action('/join')}
              >
                Chấp nhận lời mời
              </button>
              <button onClick={() => void action('/membership', 'DELETE')}>
                Từ chối
              </button>
            </>
          ) : space.myRole !== 'OWNER' ? (
            <button onClick={() => void action('/membership', 'DELETE')}>
              Rời không gian
            </button>
          ) : null
        ) : (
          <Link
            className="community-primary"
            to="/login"
            state={{ from: `/community/spaces/${id}` }}
          >
            Đăng nhập để tham gia
          </Link>
        )}
      </div>
      {error && (
        <p className="community-error" role="alert">
          {error}
        </p>
      )}
      <div className="community-space-layout">
        <div>
          <div className="community-section-heading">
            <div>
              <small>THẢO LUẬN</small>
              <h2>Bài viết</h2>
            </div>
          </div>
          {space.visibility === 'PRIVATE' && space.myStatus !== 'ACTIVE' ? (
            <div className="community-card community-empty">
              Nội dung của nhóm riêng tư chỉ hiển thị cho thành viên.
            </div>
          ) : (
            <CommunityFeed
              spaceId={space.id}
              canPost={Boolean(canPost)}
              canInteract={space.kind === 'PAGE' || space.myStatus === 'ACTIVE'}
            />
          )}
        </div>
        <aside className="community-space-aside">
          <div className="community-card">
            <h2>Về không gian này</h2>
            <p>{space.description || 'Cùng nhau học tập và trao đổi.'}</p>
            <div className="community-space-fact">
              {space.visibility === 'PRIVATE'
                ? '◈ Nhóm riêng tư'
                : '◉ Công khai'}
            </div>
            <div className="community-space-fact">
              ♧ {space.memberCount} thành viên
            </div>
          </div>
          {manager && (
            <div className="community-card community-manager">
              <h2>Quản lý thành viên</h2>
              <form onSubmit={(event) => void invite(event)}>
                <label htmlFor="invite-email">Mời qua email</label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="email@example.com"
                />
                <button className="community-primary">Gửi lời mời</button>
              </form>
              <div className="community-member-list">
                {members.map((member) => (
                  <div key={member.userId} className="community-member">
                    <strong>{member.displayName}</strong>
                    <small>{member.email}</small>
                    <small>
                      {member.role} · {member.status}
                    </small>
                    <div>
                      {member.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => void moderate(member, 'approve')}
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => void moderate(member, 'reject')}
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {member.status === 'ACTIVE' &&
                        member.role !== 'OWNER' && (
                          <>
                            {space.myRole === 'OWNER' && (
                              <button
                                onClick={() =>
                                  void moderate(
                                    member,
                                    member.role === 'ADMIN'
                                      ? 'demote'
                                      : 'promote',
                                  )
                                }
                              >
                                {member.role === 'ADMIN'
                                  ? 'Hạ quyền'
                                  : 'Nâng quyền'}
                              </button>
                            )}
                            <button
                              onClick={() => void moderate(member, 'remove')}
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      {member.status === 'INVITED' && (
                        <button onClick={() => void moderate(member, 'remove')}>
                          Thu hồi
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {moreMembers && (
                <button
                  className="community-more"
                  disabled={memberLoading}
                  onClick={() =>
                    void loadMembers(memberPage + 1).catch((cause) =>
                      setError(
                        cause instanceof Error
                          ? cause.message
                          : 'Không tải được hội viên.',
                      ),
                    )
                  }
                >
                  Xem thêm hội viên
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}
