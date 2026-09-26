import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import {
  hasRole,
  authorRoles,
  reviewRoles,
  workspaceRoles,
  roleLabels,
} from '../features/auth/roles'
import { NotificationMenu } from '../features/notifications/NotificationMenu'

export function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const member = hasRole(user?.roles, workspaceRoles)
  const signOut = async () => {
    try {
      await logout()
    } finally {
      setOpen(false)
      navigate('/')
    }
  }
  return (
    <header className="workspace-header">
      <div className="workspace-header-inner">
        <Link to="/" className="workspace-brand">
          <span>AI</span>
          <strong>
            Learning<span className="brand-dot">.</span>
          </strong>
        </Link>
        <button
          className="mobile-menu-button"
          aria-label="Mở điều hướng"
          aria-expanded={open}
          aria-controls="workspace-navigation"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
        <nav
          id="workspace-navigation"
          className={'workspace-navigation ' + (open ? 'is-open' : '')}
          aria-label="Điều hướng chính"
          onClick={() => setOpen(false)}
        >
          <NavLink end to="/">
            Trang chủ
          </NavLink>
          <NavLink to="/community/spaces">Hội nhóm</NavLink>
          <NavLink to="/courses">Khóa học</NavLink>
          {member && (
            <>
              <NavLink to="/flashcards">Thẻ ghi nhớ</NavLink>
              <NavLink to="/dashboard">Tổng quan</NavLink>
              <NavLink to="/my-learning">Lớp học của tôi</NavLink>
            </>
          )}
          {hasRole(user?.roles, [...authorRoles, ...reviewRoles]) && (
            <NavLink to="/instructor/courses">Biên soạn</NavLink>
          )}
          {user?.roles.includes('ADMIN') && (
            <NavLink to="/admin">Quản trị</NavLink>
          )}
        </nav>
        <div className="header-account">
          {user ? (
            <>
              {member && <NotificationMenu />}
              <span className="account-avatar" aria-hidden="true">
                {user.displayName.slice(0, 1).toUpperCase()}
              </span>
              <div className="account-label">
                <strong>{user.displayName}</strong>
                <small>{roleLabels[user.roles[0]] ?? 'Thành viên'}</small>
              </div>
              <button className="text-button" onClick={() => void signOut()}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="text-button">
                Đăng nhập
              </NavLink>
              <NavLink to="/register" className="primary-button">
                Bắt đầu
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
