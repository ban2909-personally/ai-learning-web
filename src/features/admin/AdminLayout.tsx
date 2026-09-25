import { NavLink, Outlet } from 'react-router-dom'
import { WorkspaceIcon } from '../../components/WorkspaceIcon'

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Quản trị">
        <div className="sidebar-title">
          <strong>Quản trị</strong>
          <span>Bảng điều khiển hệ thống</span>
        </div>
        <p className="sidebar-label">QUẢN LÝ HỆ THỐNG</p>
        <nav>
          <NavLink end to="/admin">
            <WorkspaceIcon name="dashboard" />
            Dashboard
          </NavLink>
          <NavLink to="/admin/accounts">
            <WorkspaceIcon name="users" />
            Tài khoản
          </NavLink>
          <NavLink to="/admin/courses">
            <WorkspaceIcon name="book" />
            Khóa học
          </NavLink>
          <NavLink to="/admin/permissions">
            <WorkspaceIcon name="lock" />
            Phân quyền
          </NavLink>
        </nav>
        <div className="sidebar-foot">
          AI Learning
          <br />
          <span>Không gian vận hành & giảng dạy</span>
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
