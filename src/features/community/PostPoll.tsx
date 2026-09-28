import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useCommunityApi } from './useCommunityApi'
import { CommunityIcon } from './CommunityIcon'
import type { Post } from './types'
export function PostPoll({
  post,
  canInteract,
  canModerate,
  onChange,
}: {
  post: Post
  canInteract: boolean
  canModerate: boolean
  onChange: (post: Post) => void
}) {
  const { user } = useAuth()
  const { read, write } = useCommunityApi()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const poll = post.poll!
  const closed =
    poll.closed ||
    Boolean(poll.closesAt && new Date(poll.closesAt).getTime() <= Date.now())
  const action = async (path: string, method: string, body?: unknown) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      onChange(await write<Post>(path, method, body))
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không cập nhật được bình chọn.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="community-poll" aria-label="Bình chọn bài viết">
      <div className="community-poll-title">
        <CommunityIcon name="poll" />
        <span>
          {poll.kind === 'ELECTION' ? 'BẦU CHỌN' : 'THẢO LUẬN & BÌNH CHỌN'}
        </span>
        <small>{closed ? 'Đã đóng' : 'Đang mở'}</small>
      </div>
      <h3>{poll.question}</h3>
      <div className="community-poll-options">
        {poll.options.map((option) => {
          const percent = poll.totalVotes
            ? Math.round((option.votes * 100) / poll.totalVotes)
            : 0
          return (
            <button
              key={option.id}
              type="button"
              className={poll.myOptionId === option.id ? 'is-selected' : ''}
              aria-pressed={poll.myOptionId === option.id}
              disabled={busy || closed || !user || !canInteract}
              onClick={() =>
                void action(`/community/posts/${post.id}/poll/votes`, 'POST', {
                  optionId: option.id,
                })
              }
            >
              <span
                className="community-poll-bar"
                style={{ width: `${percent}%` }}
              />
              <span className="community-poll-label">{option.label}</span>
              <strong>
                {option.votes} · {percent}%
              </strong>
            </button>
          )
        })}
      </div>
      <div className="community-poll-footer">
        <span>
          {poll.totalVotes} lượt bình chọn
          {poll.closesAt
            ? ` · Hạn: ${new Date(poll.closesAt).toLocaleString('vi-VN')}`
            : ''}
        </span>
        {user && poll.myOptionId && !closed && canInteract && (
          <button
            disabled={busy}
            onClick={() =>
              void action(`/community/posts/${post.id}/poll/votes`, 'DELETE')
            }
          >
            Rút phiếu
          </button>
        )}
        {!closed && user && (user.id === post.authorId || canModerate) && (
          <button
            disabled={busy}
            onClick={() =>
              void action(`/community/posts/${post.id}/poll/close`, 'POST')
            }
          >
            Đóng bình chọn
          </button>
        )}
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              onChange(await read<Post>(`/community/posts/${post.id}`))
              setError('')
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Không tải được kết quả.',
              )
            } finally {
              setBusy(false)
            }
          }}
        >
          Cập nhật kết quả
        </button>
      </div>
      {!user && <small>Đăng nhập để bình chọn.</small>}
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
    </section>
  )
}
