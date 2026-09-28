import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../lib/api'
import { skillLabels, type ExamSummary } from './types'
import './practice.css'

export function PracticeCatalogPage() {
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest<ExamSummary[]>('/practice/exams')
      .then(setExams)
      .catch(() => setError('Chưa thể tải danh sách đề. Vui lòng thử lại.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="practice-shell">
      <section className="practice-hero">
        <div>
          <span className="practice-kicker">ENGLISH PRACTICE STUDIO</span>
          <h1>Luyện tiếng Anh có mục tiêu. Hiểu rõ từng câu sai.</h1>
          <p>
            Thử sức với bài Nghe, Đọc và Viết theo tình huống thực tế. Kết quả
            luyện tập cho bạn thấy điểm mạnh, câu cần ôn và lời giải chi tiết.
          </p>
          <div className="practice-hero-tags">
            <span>01 · Chọn đề</span>
            <span>02 · Làm bài</span>
            <span>03 · Xem kết quả</span>
          </div>
        </div>
        <div className="practice-hero-mark" aria-hidden="true">
          <span>EN</span>
          <strong>→</strong>
          <span>GO</span>
        </div>
      </section>

      <section className="practice-section-head">
        <div>
          <span className="practice-kicker">ĐỀ LUYỆN TẬP</span>
          <h2>Bắt đầu từ đây</h2>
        </div>
        <p>
          Điểm hiển thị là số câu đúng trong bài luyện, không phải chứng chỉ
          TOEIC.
        </p>
      </section>
      {loading && <p role="status">Đang tải đề luyện tập…</p>}
      {error && (
        <p role="alert" className="practice-error">
          {error}
        </p>
      )}
      {!loading && !error && exams.length === 0 && (
        <p>Chưa có đề được phát hành.</p>
      )}
      <div className="practice-exam-grid">
        {exams.map((exam, index) => (
          <article className="practice-exam-card" key={exam.slug}>
            <div className="practice-card-top">
              <span>ĐỀ {String(index + 1).padStart(2, '0')}</span>
              <span>{exam.durationMinutes} phút</span>
            </div>
            <h3>{exam.title}</h3>
            <p>{exam.description}</p>
            <div className="practice-skill-list">
              {[...new Set(exam.skills)].map((skill) => (
                <span key={skill}>{skillLabels[skill]}</span>
              ))}
            </div>
            <Link
              to={`/practice/exams/${exam.slug}`}
              className="practice-action"
            >
              Xem đề và bắt đầu <span aria-hidden="true">↗</span>
            </Link>
          </article>
        ))}
      </div>
    </main>
  )
}
