import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { roleLabels } from '../auth/roles'
import { WorkspaceIcon } from '../../components/WorkspaceIcon'
import type { ManagedCourse } from '../authoring/types'
import { statusLabel } from '../authoring/courseStatus'

type DashboardData = {
  accounts: Record<string, number>
  courses: Record<string, number>
  recent: ManagedCourse[]
}
export function AdminDashboard() {
  const { request } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([
      request<Record<string, number>>('/admin/accounts/summary'),
      request<Record<string, number>>('/instructor/courses/summary'),
      request<ManagedCourse[]>('/instructor/courses'),
    ])
      .then(([accounts, courses, recent]) => {
        if (active) setData({ accounts, courses, recent })
      })
      .catch(() => {
        if (active) setError('Không thể tải thống kê. Vui lòng tải lại trang.')
      })
    return () => {
      active = false
    }
  }, [request])
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">QUẢN TRỊ · TỔNG QUAN</p>
          <h1>Bảng điều khiển hệ thống</h1>
          <p>Theo dõi cộng đồng học tập và nội dung đang chờ bạn xử lý.</p>
        </div>
        <Link className="primary-button" to="/admin/accounts">
          Quản lý tài khoản
        </Link>
      </div>
      {error && (
        <div role="alert" className="error-notice">
          {error}
        </div>
      )}
      {!data && !error && <p role="status">Đang tải thống kê...</p>}
      {data && (
        <>
          <div className="stat-grid">
            {(
              [
                ['Tài khoản hoạt động', data.accounts.active, 'users'],
                ['Tổng khóa học', data.courses.total, 'book'],
                ['Chờ duyệt', data.courses.PENDING_REVIEW ?? 0, 'cards'],
                ['Đã xuất bản', data.courses.PUBLISHED ?? 0, 'dashboard'],
              ] as const
            ).map(([label, count, icon], index) => (
              <article className="stat-card" key={label}>
                <span className={'stat-icon tone-' + index}>
                  <WorkspaceIcon name={icon} />
                </span>
                <div>
                  <p>{label}</p>
                  <strong>{count}</strong>
                </div>
              </article>
            ))}
          </div>
          <div className="dashboard-grid">
            <section className="workspace-panel">
              <div className="panel-heading">
                <h2>Phân bố vai trò</h2>
                <span>Tài khoản đang hoạt động</span>
              </div>
              <div className="role-distribution">
                {['ADMIN', 'LEADER', 'LECTURE', 'STUDENT', 'GUEST'].map(
                  (role, index) => {
                    const count =
                      (data.accounts[role] ?? 0) +
                      (role === 'LECTURE' ? (data.accounts.INSTRUCTOR ?? 0) : 0)
                    return (
                      <div key={role}>
                        <div className="distribution-label">
                          <span>
                            <i className={'role-dot tone-' + index} />
                            {roleLabels[role]}
                          </span>
                          <strong>{count}</strong>
                        </div>
                        <div className="distribution-track">
                          <div
                            style={{
                              width:
                                Math.min(
                                  100,
                                  (count / Math.max(1, data.accounts.active)) *
                                    100,
                                ) + '%',
                            }}
                          />
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            </section>
            <section className="workspace-panel">
              <div className="panel-heading">
                <h2>Khóa học cập nhật gần đây</h2>
                <Link to="/admin/courses">Xem tất cả →</Link>
              </div>
              <div className="table-scroll">
                <table className="workspace-table">
                  <thead>
                    <tr>
                      <th>Khóa học</th>
                      <th>Trạng thái</th>
                      <th>Bài học</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.slice(0, 5).map((course) => (
                      <tr key={course.id}>
                        <td>
                          <Link to={'/admin/courses?course=' + course.id}>
                            {course.title}
                          </Link>
                          <small>{course.slug}</small>
                        </td>
                        <td>
                          <span
                            className={'status-badge status-' + course.status}
                          >
                            {statusLabel(course.status)}
                          </span>
                        </td>
                        <td>{course.lessonCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.recent.length === 0 && (
                <div className="empty-state">
                  Chưa có khóa học. Tạo khóa học đầu tiên tại khu vực biên soạn.
                </div>
              )}
            </section>
          </div>
          <section className="workspace-panel mt-6">
            <div className="panel-heading">
              <div>
                <h2>Việc cần làm</h2>
                <p>
                  {data.courses.PENDING_REVIEW ?? 0} khóa học đang chờ kiểm
                  duyệt nội dung.
                </p>
              </div>
              <Link className="secondary-button" to="/admin/courses">
                Mở khu vực duyệt →
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  )
}
