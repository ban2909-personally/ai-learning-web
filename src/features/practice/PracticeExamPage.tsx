import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../../lib/api'
import { skillLabels, type Exam } from './types'
import './practice.css'

export function PracticeExamPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, request } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!slug) return
    apiRequest<Exam>(`/practice/exams/${slug}`)
      .then(setExam)
      .catch(() => setError('Không tìm thấy đề luyện tập.'))
  }, [slug])

  const start = async () => {
    if (!slug) return
    if (!user) {
      navigate('/login')
      return
    }
    setStarting(true)
    setError('')
    try {
      const attempt = await request<{ id: string }>(
        `/practice/exams/${slug}/attempts`,
        { method: 'POST' },
      )
      navigate(`/practice/attempts/${attempt.id}`)
    } catch {
      setError('Không thể bắt đầu bài thi. Vui lòng thử lại.')
      setStarting(false)
    }
  }

  return (
    <main className="practice-shell practice-intro">
      <Link to="/practice" className="practice-back">
        ← Danh sách đề
      </Link>
      {error && (
        <p role="alert" className="practice-error">
          {error}
        </p>
      )}
      {!exam && !error && <p>Đang tải đề…</p>}
      {exam && (
        <>
          <span className="practice-kicker">ĐỀ LUYỆN TIẾNG ANH</span>
          <h1>{exam.title}</h1>
          <p>{exam.description}</p>
          <div className="practice-intro-grid">
            <div>
              <strong>{exam.durationMinutes}</strong>
              <span>phút dự kiến</span>
            </div>
            <div>
              <strong>
                {exam.sections.reduce(
                  (count, section) => count + section.questions.length,
                  0,
                )}
              </strong>
              <span>câu hỏi</span>
            </div>
            <div>
              <strong>{exam.sections.length}</strong>
              <span>kỹ năng</span>
            </div>
          </div>
          <div className="practice-intro-sections">
            {exam.sections.map((section, index) => (
              <div key={section.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{skillLabels[section.skill]}</strong>
                  <p>
                    {section.title} · {section.questions.length} câu
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="practice-note">
            Nghe/Đọc được chấm ngay sau khi nộp. Viết sẽ hiển thị “Chờ chấm”,
            chưa cộng vào điểm.
          </p>
          <button
            type="button"
            className="practice-action"
            disabled={starting}
            onClick={() => void start()}
          >
            {starting
              ? 'Đang tạo lượt làm bài…'
              : user
                ? 'Bắt đầu làm bài →'
                : 'Đăng nhập để bắt đầu →'}
          </button>
        </>
      )}
    </main>
  )
}
