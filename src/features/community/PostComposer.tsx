import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useCommunityApi } from './useCommunityApi'
import { CommunityIcon } from './CommunityIcon'
import { PostOptions, emptyPostOptions } from './PostOptions'
import type { PostDraftOptions } from './PostOptions'
import type { Post } from './types'

export function PostComposer({
  spaceId,
  onPublished,
}: {
  spaceId?: string
  onPublished: (post: Post) => void
}) {
  const { user, upload } = useAuth()
  const { write } = useCommunityApi()
  const [body, setBody] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [options, setOptions] = useState<PostDraftOptions>(emptyPostOptions)
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!file || typeof URL.createObjectURL !== 'function') {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const hasContent = Boolean(
    body.trim() || file || options.poll?.question.trim() || options.link.trim(),
  )
  const publish = async (event: FormEvent) => {
    event.preventDefault()
    if (!hasContent || busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const appearance =
        options.link || options.background
          ? {
              attachmentUrl: options.link.trim() || null,
              backgroundColor: options.background,
              fontColor: options.font,
            }
          : null
      let poll = null
      if (options.poll) {
        const labels = options.poll.labels.map((label) => label.trim())
        if (
          !options.poll.question.trim() ||
          labels.some((label) => !label) ||
          new Set(labels.map((label) => label.toLocaleLowerCase())).size !==
            labels.length
        )
          throw new Error('Nhập câu hỏi và ít nhất hai lựa chọn khác nhau.')
        poll = {
          kind: options.poll.kind,
          question: options.poll.question.trim(),
          options: labels,
          closesAt: options.poll.closesAt
            ? new Date(options.poll.closesAt).toISOString()
            : null,
        }
      }
      const features = appearance || poll ? { appearance, poll } : null
      let post: Post
      if (file) {
        const form = new FormData()
        form.append('file', file)
        form.append('body', body.trim())
        if (spaceId) form.append('spaceId', spaceId)
        if (features)
          form.append(
            'features',
            new Blob([JSON.stringify(features)], { type: 'application/json' }),
          )
        post = await upload<Post>(
          '/community/posts/media',
          form,
          setProgress,
          'POST',
        )
      } else
        post = await write<Post>('/community/posts', 'POST', {
          body: body.trim(),
          spaceId: spaceId ?? null,
          sharedPostId: null,
          ...(features ? { features } : {}),
        })
      if (post.status === 'PENDING')
        setNotice('Bài viết đã gửi và đang chờ quản trị viên cộng đồng duyệt.')
      else {
        onPublished(post)
        setNotice('Đã đăng bài viết.')
      }
      setBody('')
      setFile(null)
      setOptions(emptyPostOptions)
      setProgress(0)
      if (input.current) input.current.value = ''
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không đăng được bài viết.',
      )
    } finally {
      setBusy(false)
    }
  }
  if (!user)
    return (
      <div className="community-card community-guest-cta">
        <strong>Chia sẻ điều bạn đang học.</strong>
        <span>Đăng nhập để đăng bài, bình luận và tham gia cộng đồng.</span>
        <Link
          className="community-primary"
          to="/login"
          state={{ from: spaceId ? `/community/spaces/${spaceId}` : '/' }}
        >
          Đăng nhập
        </Link>
      </div>
    )
  return (
    <>
      <form
        className="community-card community-composer"
        onSubmit={(event) => void publish(event)}
      >
        <div className="community-avatar">
          {user.displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="community-composer-content">
          <label htmlFor="new-post" className="sr-only">
            Nội dung bài viết
          </label>
          <textarea
            id="new-post"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={5000}
            placeholder={`Bạn muốn chia sẻ kiến thức gì, ${user.displayName}?`}
            rows={3}
            disabled={busy}
          />
          <div className="community-composer-footer">
            <label className="community-file-button">
              <CommunityIcon name="photo" /> Ảnh / video
              <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                disabled={busy}
                aria-label="Ảnh hoặc video bài viết"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null
                  if (
                    selected &&
                    (selected.size <= 0 ||
                      selected.size >= 10_000_000 ||
                      ![
                        'image/jpeg',
                        'image/png',
                        'image/webp',
                        'video/mp4',
                        'video/webm',
                      ].includes(selected.type))
                  ) {
                    setError(
                      'Chọn JPEG, PNG, WebP, MP4 hoặc WebM nhỏ hơn 10 MB.',
                    )
                    event.target.value = ''
                    setFile(null)
                    return
                  }
                  setFile(selected)
                  setError('')
                  setProgress(0)
                }}
              />
            </label>
            <span>
              {spaceId
                ? 'Bài của thành viên cần quản trị viên duyệt trước khi hiển thị.'
                : 'Chia sẻ câu hỏi, tài liệu hoặc kinh nghiệm học tập'}
            </span>
            <button
              className="community-primary"
              disabled={busy || !hasContent}
            >
              {busy ? 'Đang đăng…' : 'Đăng bài'}
            </button>
          </div>
          <PostOptions value={options} onChange={setOptions} disabled={busy} />
          {file && (
            <div className="community-upload-status" role="status">
              <span>
                {file.name} · {(file.size / 1_000_000).toFixed(2)} MB
              </span>
              {preview &&
                (file.type.startsWith('video/') ? (
                  <video
                    className="community-composer-preview"
                    src={preview}
                    controls
                    preload="metadata"
                    aria-label="Video xem trước"
                  />
                ) : (
                  <img
                    className="community-composer-preview"
                    src={preview}
                    alt="Ảnh xem trước"
                  />
                ))}
              <small>
                Ảnh/video và bài viết này tự hết hạn sau 14 ngày kể từ lúc tải
                lên.
              </small>
              {busy ? (
                <progress
                  value={progress}
                  max={100}
                  aria-label="Tiến độ tải media"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    if (input.current) input.current.value = ''
                  }}
                >
                  Bỏ file
                </button>
              )}
            </div>
          )}
          {error && (
            <p className="community-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>
      {notice && (
        <p className="community-inline-note" role="status">
          {notice}
        </p>
      )}
    </>
  )
}
