import { useEffect, useState, type FormEvent } from 'react'
import { apiRequest, ApiError } from '../../lib/api'
import type { Category } from '../../types/catalog'
import { useAuth } from '../auth/AuthContext'
import type { ManagedCourse } from './types'

export function CreateCourseForm({
  onCreated,
  onCancel,
}: {
  onCreated: (course: ManagedCourse) => void
  onCancel: () => void
}) {
  const { request } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    apiRequest<Category[]>('/categories')
      .then(setCategories)
      .catch(() => setError('Không thể tải danh mục.'))
  }, [])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setError('')
    try {
      const course = await request<ManagedCourse>('/instructor/courses', {
        method: 'POST',
        body: JSON.stringify({ ...values, price: Number(values.price) }),
      })
      onCreated(course)
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Không thể tạo khóa học.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="workspace-panel p-6">
      <div className="panel-heading px-0 pt-0">
        <div>
          <h2>Tạo khóa học mới</h2>
          <p>Bắt đầu bằng bản nháp, hoàn thiện giáo trình rồi gửi duyệt.</p>
        </div>
      </div>
      {error && (
        <div role="alert" className="error-notice">
          {error}
        </div>
      )}
      <form className="form-grid" onSubmit={submit}>
        <label className="full-width">
          Tên khóa học
          <input
            name="title"
            className="field"
            required
            maxLength={180}
            placeholder="Ví dụ: Java nền tảng cho người mới"
          />
        </label>
        <label>
          Đường dẫn
          <input
            name="slug"
            className="field"
            required
            maxLength={160}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="java-nen-tang"
          />
          <small>Chữ thường không dấu, số và dấu gạch ngang.</small>
        </label>
        <label>
          Danh mục
          <select name="categoryId" className="field" required defaultValue="">
            <option value="" disabled>
              Chọn danh mục
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trình độ
          <select name="level" className="field">
            <option value="BEGINNER">Cơ bản</option>
            <option value="INTERMEDIATE">Trung cấp</option>
            <option value="ADVANCED">Nâng cao</option>
          </select>
        </label>
        <label>
          Học phí (VND)
          <input
            type="number"
            name="price"
            min="0"
            max="9999999999"
            defaultValue="0"
            className="field"
            required
          />
          <small>Nhập 0 cho khóa học miễn phí.</small>
        </label>
        <label className="full-width">
          Giới thiệu ngắn
          <textarea
            name="shortDescription"
            className="field"
            required
            maxLength={320}
            rows={2}
          />
        </label>
        <label className="full-width">
          Nội dung và mục tiêu
          <textarea
            name="description"
            className="field"
            required
            maxLength={20000}
            rows={5}
          />
        </label>
        <div className="form-actions full-width">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Hủy
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? 'Đang tạo...' : 'Tạo bản nháp'}
          </button>
        </div>
      </form>
    </section>
  )
}
