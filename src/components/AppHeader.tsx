import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import {
  hasRole,
  authorRoles,
  reviewRoles,
  workspaceRoles,
  roleLabels,
} from '../features/auth/roles'
import { NotificationMenu } from '../features/notifications/NotificationMenu'
import { DirectChatMenu } from '../features/messaging/DirectChatMenu'

export function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const staffMenu = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    staffMenu.current?.removeAttribute('open')
    setOpen(false)
  }, [location.pathname])
  useEffect(() => {
    const dismiss = (event: MouseEvent) => {
      if (!staffMenu.current?.contains(event.target as Node)) {
        staffMenu.current?.removeAttribute('open')
      }
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        staffMenu.current?.removeAttribute('open')
        setOpen(false)
      }
    }
    document.addEventListener('click', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('click', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [])
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
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path
              d={open ? 'M5 5l14 14M19 5 5 19' : 'M4 7h16M4 12h16M4 17h16'}
            />
          </svg>
        </button>
        <nav
          id="workspace-navigation"
          className={'workspace-navigation ' + (open ? 'is-open' : '')}
          aria-label="Điều hướng chính"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) setOpen(false)
          }}
        >
          <NavLink end to="/">
            Trang chủ
          </NavLink>
          <NavLink to="/community/spaces">Hội nhóm</NavLink>
          <NavLink to="/courses">Khóa học</NavLink>
          <NavLink to="/practice">Luyện thi tiếng Anh</NavLink>
          {member && (
            <>
              <NavLink to="/flashcards">Thẻ ghi nhớ</NavLink>
              <NavLink to="/dashboard">Tổng quan</NavLink>
              <NavLink to="/my-learning">Lớp học của tôi</NavLink>
            </>
          )}
          {hasRole(user?.roles, [...authorRoles, ...reviewRoles]) && (
            <details className="staff-navigation" ref={staffMenu}>
              <summary>
                Kho học liệu <span aria-hidden="true">⌄</span>
              </summary>
              <div className="staff-navigation-menu">
                <NavLink to="/instructor/courses">Biên soạn khóa học</NavLink>
                <NavLink to="/instructor/exams">Soạn và duyệt đề thi</NavLink>
                <NavLink to="/instructor/writing-reviews">
                  Chấm bài viết
                </NavLink>
              </div>
            </details>
          )}
          {user?.roles.includes('ADMIN') && (
            <NavLink to="/admin">Quản trị</NavLink>
          )}
        </nav>
        <div className="header-account">
          {user ? (
            <>
              {member && <NotificationMenu />}
              <DirectChatMenu key={user.id} />
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
