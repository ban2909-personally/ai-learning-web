import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  hasRole,
  authorRoles,
  reviewRoles,
  roleLabels,
  workspaceRoles,
} from '../auth/roles'
import { WorkspaceIcon } from '../../components/WorkspaceIcon'

export function WorkspaceHome() {
  const { user } = useAuth()
  const links = [
    {
      title: 'Khám phá khóa học',
      description: 'Tìm kỹ năng mới và bắt đầu lộ trình tiếp theo.',
      path: '/courses',
      icon: 'book' as const,
    },
    ...(hasRole(user?.roles, workspaceRoles)
      ? [
          {
            title: 'Không gian học tập',
            description: 'Tiếp tục bài học và theo dõi tiến độ của bạn.',
            path: '/dashboard',
            icon: 'dashboard' as const,
          },
          {
            title: 'Thẻ ghi nhớ',
            description: 'Tạo bộ thẻ cá nhân, lật thẻ và luyện ghi nhớ.',
            path: '/flashcards',
            icon: 'cards' as const,
          },
        ]
      : []),
    ...(hasRole(user?.roles, [...authorRoles, ...reviewRoles])
      ? [
          {
            title: 'Biên soạn & kiểm duyệt',
            description: 'Quản lý giáo trình, tải video và xuất bản khóa học.',
            path: '/instructor/courses',
            icon: 'book' as const,
          },
        ]
      : []),
    ...(user?.roles.includes('ADMIN')
      ? [
          {
            title: 'Quản trị hệ thống',
            description: 'Quản lý tài khoản, phân quyền và nội dung.',
            path: '/admin',
            icon: 'users' as const,
          },
        ]
      : []),
  ]
  return (
    <main className="page-container">
      <section className="welcome-banner">
        <div>
          <p className="eyebrow">AI LEARNING · KHÔNG GIAN CỦA BẠN</p>
          <h1>
            Chào {user?.displayName},<br />
            hôm nay bạn muốn làm gì?
          </h1>
          <p>
            Mỗi ngày một bước tiến trên hành trình học và chia sẻ kiến thức.
          </p>
          <span className="welcome-role">
            {user?.email} · {roleLabels[user?.roles[0] ?? 'GUEST']}
          </span>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <span>&lt;/&gt;</span>
          <i>Learn. Build. Grow.</i>
        </div>
      </section>
      <div className="page-heading mt-10">
        <div>
          <p className="eyebrow">TRUY CẬP NHANH</p>
          <h2>Khu vực dành cho bạn</h2>
        </div>
      </div>
      <div className="quick-link-grid">
        {links.map((link) => (
          <Link className="quick-link" key={link.path} to={link.path}>
            <WorkspaceIcon name={link.icon} />
            <div>
              <h3>{link.title}</h3>
              <p>{link.description}</p>
            </div>
            <span>→</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
