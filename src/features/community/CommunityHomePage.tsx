import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { CommunityFeed } from './CommunityFeed'
import { useCommunityApi } from './useCommunityApi'
import type { Space } from './types'

export function CommunityHomePage() {
  const { user } = useAuth()
  const { read } = useCommunityApi()
  const [spaces, setSpaces] = useState<Space[]>([])
  useEffect(() => {
    void read<Space[]>('/community/spaces')
      .then(setSpaces)
      .catch(() => setSpaces([]))
  }, [read])
  return (
    <main className="community-shell">
      <aside
        className="community-side community-side-left"
        aria-label="Khám phá"
      >
        <div className="community-side-title">Không gian của bạn</div>
        <Link to="/">
          ⌂ <span>Bảng tin</span>
        </Link>
        <Link to="/community/spaces">
          ♧ <span>Hội nhóm & trang</span>
        </Link>
        <Link to="/courses">
          ◫ <span>Khóa học</span>
        </Link>
        {user && (
          <>
            <div className="community-side-title">Học tập</div>
            <Link to="/flashcards">
              ◇ <span>Thẻ ghi nhớ</span>
            </Link>
            <Link to="/my-learning">
              ▤ <span>Lớp học của tôi</span>
            </Link>
          </>
        )}
        <div className="community-side-note">
          Một nơi để hỏi, chia sẻ và học cùng nhau.
        </div>
      </aside>
      <div className="community-main">
        <div className="community-hero">
          <span className="community-eyebrow">AI LEARNING COMMUNITY</span>
          <h1>
            Học cùng nhau,
            <br />
            <em>tiến xa hơn.</em>
          </h1>
          <p>
            Chia sẻ điều bạn biết. Hỏi điều bạn chưa rõ. Tìm cộng đồng cùng đam
            mê.
          </p>
          <Link to="/community/spaces">
            Khám phá hội nhóm <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="community-section-heading">
          <div>
            <small>BẢNG TIN</small>
            <h2>Chuyện hôm nay</h2>
          </div>
          <span>Bài viết mới nhất từ cộng đồng</span>
        </div>
        <CommunityFeed />
      </div>
      <aside
        className="community-side community-side-right"
        aria-label="Cộng đồng nổi bật"
      >
        <div className="community-discover">
          <small>KHÁM PHÁ</small>
          <h2>Gặp gỡ người cùng học</h2>
          <p>Mỗi câu hỏi là một cơ hội để tiến bộ.</p>
          <Link to="/community/spaces">Xem tất cả nhóm & trang →</Link>
        </div>
        <div className="community-side-title">Nhóm & trang gần đây</div>
        {spaces.slice(0, 5).map((space) => (
          <Link
            className="community-space-mini"
            to={`/community/spaces/${space.id}`}
            key={space.id}
          >
            <span>{space.kind === 'GROUP' ? '♧' : '▣'}</span>
            <span>
              <strong>{space.name}</strong>
              <small>
                {space.memberCount} thành viên ·{' '}
                {space.kind === 'GROUP' ? 'Nhóm' : 'Trang'}
              </small>
            </span>
          </Link>
        ))}
        {spaces.length === 0 && (
          <p className="community-side-note">
            Hãy tạo không gian học tập đầu tiên.
          </p>
        )}
      </aside>
    </main>
  )
}
