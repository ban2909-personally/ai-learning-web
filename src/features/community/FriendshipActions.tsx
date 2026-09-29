import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useDirectChatLauncher } from '../messaging/DirectChatContext'
import { CommunityIcon } from './CommunityIcon'
import { useCommunityApi } from './useCommunityApi'
import type {
  FriendshipRelationship,
  FriendshipSummary,
  PublicProfile,
} from './types'

export function FriendshipActions({
  person,
  relationship,
  onChange,
}: {
  person: PublicProfile
  relationship: FriendshipRelationship
  onChange: (value: FriendshipSummary) => void
}) {
  const { user } = useAuth()
  const { write } = useCommunityApi()
  const { openChat } = useDirectChatLauncher()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (user?.id === person.id || relationship === 'SELF') return null
  if (!user)
    return (
      <Link className="community-primary" to="/login">
        Đăng nhập để kết nối
      </Link>
    )
  const act = async (action: 'request' | 'accept' | 'remove') => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await write<FriendshipSummary>(
        `/community/people/${person.id}/friendship${action === 'accept' ? '/accept' : ''}`,
        action === 'remove' ? 'DELETE' : 'POST',
      )
      onChange(result)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không thể cập nhật kết bạn. Hãy tải lại hồ sơ.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="social-profile-actions">
      {relationship === 'NONE' && (
        <button
          className="community-primary"
          disabled={busy}
          onClick={() => void act('request')}
        >
          <CommunityIcon name="spaces" />
          Thêm bạn bè
        </button>
      )}
      {relationship === 'OUTGOING' && (
        <button
          className="community-more"
          disabled={busy}
          onClick={() => void act('remove')}
        >
          Hủy lời mời
        </button>
      )}
      {relationship === 'INCOMING' && (
        <>
          <button
            className="community-primary"
            disabled={busy}
            onClick={() => void act('accept')}
          >
            Chấp nhận kết bạn
          </button>
          <button
            className="community-more"
            disabled={busy}
            onClick={() => void act('remove')}
          >
            Từ chối
          </button>
        </>
      )}
      {relationship === 'FRIENDS' && (
        <details className="social-friend-menu">
          <summary>Bạn bè ✓</summary>
          <button disabled={busy} onClick={() => void act('remove')}>
            Hủy kết bạn
          </button>
        </details>
      )}
      <button className="community-more" onClick={() => openChat(person)}>
        <CommunityIcon name="chat" />
        Nhắn tin
      </button>
      {busy && <span role="status">Đang cập nhật…</span>}
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
    </div>
  )
}
