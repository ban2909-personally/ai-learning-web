import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { authorRoles, hasRole } from '../auth/roles'
import { statusLabel } from './courseStatus'
import { CreateCourseForm } from './CreateCourseForm'
import { CourseEditor } from './CourseEditor'
import type { ManagedCourse } from './types'

export function CourseStudioPage() {
  const { request, user } = useAuth()
  const location = useLocation()
  const [courses, setCourses] = useState<ManagedCourse[]>([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [params, setParams] = useSearchParams()
  const selected = params.get('course')
  const creating = params.has('new')
  const load = useCallback(async () => {
    try {
      setCourses(
        await request<ManagedCourse[]>('/instructor/courses?page=' + page),
      )
      setError('')
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Không thể tải khóa học.',
      )
    }
  }, [request, page])
  useEffect(() => {
    void load()
  }, [load])
  return (
    <div
      className={
        user?.roles.includes('ADMIN') && location.pathname.startsWith('/admin')
          ? ''
          : 'page-container'
      }
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">KHÔNG GIAN GIẢNG DẠY</p>
          <h1>Biên soạn khóa học</h1>
          <p>Từ ý tưởng đầu tiên đến bài học được xuất bản.</p>
        </div>
        {hasRole(user?.roles, authorRoles) && (
          <Link className="primary-button" to="?new=1">
            + Đăng khóa học
          </Link>
        )}
      </div>
      {error && (
        <div role="alert" className="error-notice">
          {error}
        </div>
      )}
      {creating && (
        <CreateCourseForm
          onCancel={() => setParams({})}
          onCreated={(course) => {
            setParams({ course: course.id })
            void load()
          }}
        />
      )}
      {selected && (
        <CourseEditor
          key={selected}
          id={selected}
          onUpdated={() => void load()}
          onClose={() => setParams({})}
        />
      )}
      <div className="studio-grid mt-6">
        {courses.map((course) => (
          <article key={course.id} className="workspace-panel studio-card">
            <div className="flex items-center justify-between">
              <span className={'status-badge status-' + course.status}>
                {statusLabel(course.status)}
              </span>
              <span className="text-xs text-slate-500">
                {course.lessonCount} bài học
              </span>
            </div>
            <h2>{course.title}</h2>
            <p>{course.shortDescription}</p>
            <div className="studio-card-footer">
              <small>
                {new Date(course.updatedAt).toLocaleDateString('vi-VN')}
              </small>
              <button
                className="text-button"
                onClick={() => {
                  setParams({ course: course.id })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                Mở giáo trình →
              </button>
            </div>
          </article>
        ))}
      </div>
      {!courses.length && !error && (
        <div className="empty-state">
          Chưa có khóa học trong phạm vi của bạn.
        </div>
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
          disabled={courses.length < 50}
          onClick={() => setPage(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  )
}
