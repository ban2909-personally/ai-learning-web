import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useCommunityApi } from './useCommunityApi'
import { CommunityIcon } from './CommunityIcon'
import type { Post, ReactionKind } from './types'

const choices: { kind: ReactionKind; label: string }[] = [
  { kind: 'LIKE', label: 'Thích' },
  { kind: 'LOVE', label: 'Yêu thích' },
  { kind: 'CARE', label: 'Quan tâm' },
  { kind: 'HAHA', label: 'Haha' },
  { kind: 'WOW', label: 'Wow' },
  { kind: 'SAD', label: 'Buồn' },
  { kind: 'ANGRY', label: 'Phẫn nộ' },
]

export function ReactionIcon({ kind }: { kind: ReactionKind }) {
  if (kind === 'LIKE')
    return (
      <span className="community-reaction-like">
        <CommunityIcon name="like" />
      </span>
    )
  if (kind === 'LOVE')
    return (
      <svg
        className="community-reaction-icon"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <circle cx="16" cy="16" r="15" fill="#ed4264" />
        <path
          d="M16 25 6 15C0 5 12 4 16 11c4-7 16-6 10 4Z"
          fill="#fff"
          transform="translate(2 1) scale(.88)"
        />
      </svg>
    )
  const angry = kind === 'ANGRY'
  return (
    <svg
      className="community-reaction-icon"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" fill={angry ? '#f87950' : '#ffd263'} />
      <circle cx="11" cy="13" r="1.7" fill="#654323" />
      <circle cx="21" cy="13" r="1.7" fill="#654323" />
      {kind === 'WOW' ? (
        <ellipse cx="16" cy="22" rx="3" ry="4" fill="#654323" />
      ) : kind === 'SAD' || angry ? (
        <path
          d="M11 24q5-6 10 0"
          fill="none"
          stroke="#654323"
          strokeWidth="2"
        />
      ) : (
        <path d="M9 19q7 11 14 0Z" fill="#654323" />
      )}
      {kind === 'SAD' && <path d="M24 16q-6 7 0 7t0-7Z" fill="#51a9ee" />}
      {angry && <path d="m7 8 7 3m11-3-7 3" stroke="#654323" strokeWidth="2" />}
      {kind === 'CARE' && (
        <path d="M16 29 10 23c-4-6 3-8 6-3 3-5 10-3 6 3Z" fill="#ed4264" />
      )}
    </svg>
  )
}

export function ReactionSummary({ post }: { post: Post }) {
  const kinds = choices.filter(
    (item) => (post.reactionCounts?.[item.kind] ?? 0) > 0,
  )
  return (
    <span className="community-reaction-summary">
      {(kinds.length ? kinds : post.likeCount ? [choices[0]] : [])
        .slice(0, 3)
        .map((item) => (
          <span
            key={item.kind}
            title={
              item.label +
              ': ' +
              (post.reactionCounts?.[item.kind] ?? post.likeCount)
            }
          >
            <ReactionIcon kind={item.kind} />
          </span>
        ))}
      <span>{post.likeCount} lượt thích</span>
    </span>
  )
}

export function PostReactions({
  post,
  canInteract,
  onChange,
}: {
  post: Post
  canInteract: boolean
  onChange: (post: Post) => void
}) {
  const { user } = useAuth()
  const { write } = useCommunityApi()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const selected = post.viewerReaction ?? (post.likedByViewer ? 'LIKE' : null)
  const disabled = !user || !canInteract || busy
  const action = async (kind?: ReactionKind) => {
    if (disabled) return
    setBusy(true)
    try {
      const value = kind
        ? await write<Post>(
            '/community/posts/' + post.id + '/reactions',
            'POST',
            { kind },
          )
        : await write<Post>(
            '/community/posts/' + post.id + '/likes',
            post.likedByViewer ? 'DELETE' : 'POST',
          )
      onChange(value)
      setOpen(false)
      setError('')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không lưu được cảm xúc.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="community-reaction-control">
      <button
        disabled={disabled}
        aria-pressed={Boolean(selected)}
        onClick={() => void action()}
      >
        {selected ? (
          <ReactionIcon kind={selected} />
        ) : (
          <CommunityIcon name="like" />
        )}
        {selected
          ? selected === 'LIKE'
            ? 'Đã thích'
            : choices.find((item) => item.kind === selected)!.label
          : 'Thích'}
      </button>
      <button
        className="community-reaction-picker-toggle"
        aria-label="Chọn cảm xúc"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        ⌄
      </button>
      {open && (
        <div
          className="community-reaction-picker"
          role="group"
          aria-label="Cảm xúc bài viết"
        >
          {choices.map((item) => (
            <button
              key={item.kind}
              type="button"
              title={item.label}
              aria-label={item.label}
              aria-pressed={selected === item.kind}
              disabled={disabled}
              onClick={() => void action(item.kind)}
            >
              <ReactionIcon kind={item.kind} />
              <small>{item.label}</small>
            </button>
          ))}
          <button aria-label="Đóng chọn cảm xúc" onClick={() => setOpen(false)}>
            <CommunityIcon name="close" />
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
    </div>
  )
}
