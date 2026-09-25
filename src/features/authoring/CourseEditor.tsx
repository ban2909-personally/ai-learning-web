import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { authorRoles, hasRole, reviewRoles } from '../auth/roles'
import { statusLabel } from './courseStatus'
import { validateMediaFile } from '../learning/mediaUpload'
import type { CourseWorkspace, ManagedLesson } from './types'

export function CourseEditor({
  id,
  onUpdated,
  onClose,
}: {
  id: string
  onUpdated: () => void
  onClose: () => void
}) {
  const { request, user } = useAuth()
  const [workspace, setWorkspace] = useState<CourseWorkspace | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    try {
      setWorkspace(await request<CourseWorkspace>('/instructor/courses/' + id))
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Không thể tải giáo trình.',
      )
    }
  }, [id, request])
  useEffect(() => {
    void load()
  }, [load])
  const course = workspace?.course
  const owns =
    hasRole(user?.roles, authorRoles) &&
    (user?.roles.includes('ADMIN') || user?.id === course?.instructorId)
  const reviews = hasRole(user?.roles, reviewRoles)
  const changeStatus = async (status: string) => {
    setBusy(true)
    setError('')
    try {
      await request('/instructor/courses/' + id + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await load()
      onUpdated()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Không thể đổi trạng thái.',
      )
    } finally {
      setBusy(false)
    }
  }
  const addLesson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true)
    setError('')
    try {
      await request('/instructor/courses/' + id + '/lessons', {
        method: 'POST',
        body: JSON.stringify({
          sectionTitle: data.get('sectionTitle'),
          title: data.get('title'),
          contentUrl: data.get('contentUrl'),
          durationSeconds: Number(data.get('durationSeconds')),
          preview: data.get('preview') === 'on',
        }),
      })
      form.reset()
      await load()
      onUpdated()
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Không thể thêm bài học.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="workspace-panel course-editor">
      <div className="panel-heading">
        <div>
          <h2>{course?.title ?? 'Đang tải khóa học...'}</h2>
          <p>{course && statusLabel(course.status)} · Giáo trình & nội dung</p>
        </div>
        <button className="secondary-button" onClick={onClose}>
          Đóng
        </button>
      </div>
      {error && (
        <div role="alert" className="error-notice mx-6">
          {error}
        </div>
      )}
      {workspace && (
        <div className="p-6">
          <div className="form-actions mb-6">
            {owns && course?.status === 'DRAFT' && (
              <button
                className="primary-button"
                disabled={busy}
                onClick={() => void changeStatus('PENDING_REVIEW')}
              >
                Gửi duyệt khóa học
              </button>
            )}
            {reviews && course?.status === 'PENDING_REVIEW' && (
              <>
                <button
                  className="primary-button"
                  disabled={busy}
                  onClick={() => void changeStatus('PUBLISHED')}
                >
                  Duyệt & xuất bản
                </button>
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => void changeStatus('DRAFT')}
                >
                  Trả về bản nháp
                </button>
              </>
            )}
            {reviews && course?.status === 'PUBLISHED' && (
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => void changeStatus('ARCHIVED')}
              >
                Lưu trữ khóa học
              </button>
            )}
          </div>
          <div className="space-y-3">
            {workspace.lessons.map((lesson, index) => (
              <article key={lesson.id} className="lesson-editor-row">
                <div>
                  <small>
                    {lesson.sectionTitle} · Bài {index + 1}
                  </small>
                  <h3>{lesson.title}</h3>
                  <p>
                    {lesson.preview
                      ? 'Cho phép xem trước'
                      : 'Dành cho học viên ghi danh'}{' '}
                    · {lesson.durationSeconds} giây
                  </p>
                  <p
                    className={
                      lesson.contentUrl ? 'text-emerald-700' : 'text-amber-700'
                    }
                  >
                    {lesson.contentUrl
                      ? 'Đã có nội dung'
                      : 'Chưa có video hoặc liên kết'}
                  </p>
                </div>
                {owns && (
                  <LessonUpload
                    slug={workspace.course.slug}
                    lesson={lesson}
                    onUploaded={() => void load()}
                  />
                )}
              </article>
            ))}
          </div>
          {workspace.lessons.length === 0 && (
            <div className="empty-state">
              Chưa có bài học. Thêm chương và bài học đầu tiên ở bên dưới.
            </div>
          )}
          {owns && course?.status === 'DRAFT' && (
            <form
              className="form-grid mt-8 border-t border-slate-200 pt-6"
              onSubmit={addLesson}
            >
              <h3 className="full-width text-lg font-semibold">Thêm bài học</h3>
              <label>
                Tên chương
                <input
                  name="sectionTitle"
                  className="field"
                  required
                  maxLength={180}
                  placeholder="Chương 1 · Bắt đầu"
                />
              </label>
              <label>
                Tên bài học
                <input
                  name="title"
                  className="field"
                  required
                  maxLength={180}
                />
              </label>
              <label>
                Liên kết nội dung HTTPS
                <input
                  type="url"
                  name="contentUrl"
                  className="field"
                  maxLength={1000}
                  placeholder="Để trống nếu tải video lên sau"
                />
              </label>
              <label>
                Thời lượng (giây)
                <input
                  type="number"
                  name="durationSeconds"
                  className="field"
                  min={0}
                  max={86400}
                  defaultValue={0}
                  required
                />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="preview" />
                Cho phép xem trước
              </label>
              <button className="primary-button" disabled={busy}>
                + Thêm vào giáo trình
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  )
}

function LessonUpload({
  slug,
  lesson,
  onUploaded,
}: {
  slug: string
  lesson: ManagedLesson
  onUploaded: () => void
}) {
  const { upload } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const submit = async () => {
    if (!file) return
    const validation = validateMediaFile(file)
    if (validation) {
      setError(validation)
      return
    }
    const body = new FormData()
    body.append('file', file)
    setBusy(true)
    setError('')
    try {
      await upload(
        '/instructor/courses/' +
          encodeURIComponent(slug) +
          '/lessons/' +
          lesson.id +
          '/media',
        body,
        setProgress,
      )
      setFile(null)
      onUploaded()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Không thể tải video lên.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="upload-control">
      <label className="secondary-button">
        Chọn video
        <input
          className="sr-only"
          type="file"
          accept="video/mp4,video/webm"
          aria-label={'Video cho ' + lesson.title}
          disabled={busy}
          onChange={(event) => {
            const selected = event.target.files?.[0]
            setFile(selected ?? null)
            setError(selected ? (validateMediaFile(selected) ?? '') : '')
          }}
        />
      </label>
      <span className="truncate text-xs text-slate-500">
        {file?.name ?? 'MP4 / WebM · dưới 10 MB'}
      </span>
      <button
        className="primary-button"
        disabled={!file || !!error || busy}
        onClick={() => void submit()}
      >
        {busy ? progress + '%' : 'Tải lên'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
