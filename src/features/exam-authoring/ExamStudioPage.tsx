import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { authorRoles, hasRole } from '../auth/roles'
import { ApiError } from '../../lib/api'
import {
  revisionLabels,
  type ExamRevision,
  type ExamRevisionSummary,
} from './types'
import './exam-authoring.css'

export function ExamStudioPage() {
  const { request, user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<ExamRevisionSummary[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    request<ExamRevisionSummary[]>('/practice/authoring/exams?page=' + page)
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch((caught: unknown) => {
        if (!cancelled)
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Không thể tải đề thi.',
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [request, page])

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setSaving(true)
    setError('')
    try {
      const result = await request<ExamRevision>('/practice/authoring/exams', {
        method: 'POST',
        body: JSON.stringify({
          slug: data.get('slug'),
          title: data.get('title'),
          description: data.get('description'),
          durationMinutes: Number(data.get('durationMinutes')),
        }),
      })
      navigate('/instructor/exams/' + result.id)
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Không thể tạo đề thi.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="exam-studio">
      <header className="exam-studio-heading">
        <div>
          <p className="exam-eyebrow">ENGLISH ASSESSMENT · CONTENT STUDIO</p>
          <h1>Không gian soạn đề</h1>
          <p>
            Soạn nội dung, gửi duyệt và phát hành. Mỗi lần sửa đề đã phát hành
            là một phiên bản mới.
          </p>
        </div>
        {hasRole(user?.roles, authorRoles) && (
          <button
            className="primary-button"
            onClick={() => setCreating(!creating)}
          >
            {creating ? 'Đóng biểu mẫu' : '+ Tạo đề tiếng Anh'}
          </button>
        )}
      </header>
      <div className="exam-workflow" aria-label="Quy trình phát hành">
        <span>
          <b>01</b> Soạn bản nháp
        </span>
        <span>
          <b>02</b> Leader / Admin duyệt
        </span>
        <span>
          <b>03</b> Học viên luyện thi
        </span>
      </div>
      {error && (
        <p role="alert" className="error-notice">
          {error}
        </p>
      )}
      {creating && (
        <form
          className="exam-create-card"
          onSubmit={(event) => void create(event)}
        >
          <h2>Tạo bản nháp mới</h2>
          <div className="exam-field-grid">
            <label>
              Tên đề
              <input
                name="title"
                required
                maxLength={180}
                placeholder="English Workplace · Practice 01"
              />
            </label>
            <label>
              Mã đường dẫn
              <input
                name="slug"
                required
                maxLength={120}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="english-workplace-01"
              />
            </label>
            <label>
              Thời lượng (phút)
              <input
                name="durationMinutes"
                type="number"
                min={1}
                max={240}
                defaultValue={35}
                required
              />
            </label>
            <label>
              Mô tả
              <textarea name="description" maxLength={1000} rows={2} />
            </label>
          </div>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Đang tạo…' : 'Tạo bản nháp'}
          </button>
        </form>
      )}
      {loading ? (
        <p role="status">Đang tải đề thi…</p>
      ) : (
        <>
          <div className="exam-studio-grid">
            {items.map((item) => (
              <article className="exam-revision-card" key={item.id}>
                <span className={'exam-status exam-status-' + item.status}>
                  {revisionLabels[item.status]}
                </span>
                <h2>{item.title}</h2>
                <p>{item.slug}</p>
                <div className="exam-card-meta">
                  <span>Phiên bản {item.revision}</span>
                  <span>{item.durationMinutes} phút</span>
                </div>
                <Link
                  className="exam-card-link"
                  to={'/instructor/exams/' + item.id}
                >
                  Mở nội dung →
                </Link>
              </article>
            ))}
          </div>
          {items.length === 0 && (
            <div className="empty-state">Chưa có đề trong phạm vi của bạn.</div>
          )}
          <div className="pagination">
            <button
              className="secondary-button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </button>
            <span>Trang {page + 1}</span>
            <button
              className="secondary-button"
              disabled={items.length < 20}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </button>
          </div>
        </>
      )}
    </main>
  )
}
