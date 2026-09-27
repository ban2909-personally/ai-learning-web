import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { skillLabels, type Attempt, type Result } from './types'
import './practice.css'

export function PracticeResultPage() {
  const { id } = useParams()
  const { request } = useAuth()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [activeSkill, setActiveSkill] = useState(0)

  useEffect(() => {
    if (!id) return
    Promise.all([
      request<Attempt>(`/practice/attempts/${id}`),
      request<Result>(`/practice/attempts/${id}/result`),
    ])
      .then(([work, score]) => {
        setAttempt(work)
        setResult(score)
      })
      .catch(() => setError('Chưa thể tải kết quả bài làm.'))
  }, [id, request])

  if (error)
    return (
      <main className="practice-shell">
        <p role="alert" className="practice-error">
          {error}
        </p>
      </main>
    )
  if (!attempt || !result)
    return (
      <main className="practice-shell">
        <p>Đang tải kết quả…</p>
      </main>
    )

  const section = result.sections[activeSkill]
  const examSection = attempt.exam.sections[activeSkill]
  return (
    <main className="practice-shell practice-results">
      <Link to="/practice" className="practice-back">
        ← Danh sách đề
      </Link>
      <section className="practice-result-hero">
        <div>
          <span className="practice-kicker">KẾT QUẢ LUYỆN TẬP</span>
          <h1>{result.examTitle}</h1>
          <p>
            Đây là số câu đúng trong đề minh họa, không phải điểm TOEIC chính
            thức.
          </p>
        </div>
        <div className="practice-score">
          <strong>
            {result.correct}
            <small>/{result.total}</small>
          </strong>
          <span>câu đúng · Nghe & Đọc</span>
        </div>
      </section>
      <div className="practice-result-stats">
        {result.sections.map((part) => (
          <div key={part.skill}>
            <span>{skillLabels[part.skill]}</span>
            <strong>
              {part.skill === 'WRITING'
                ? 'Chờ chấm'
                : `${part.correct}/${part.total}`}
            </strong>
          </div>
        ))}
      </div>
      <div
        className="practice-result-tabs"
        role="tablist"
        aria-label="Xem theo kỹ năng"
      >
        {result.sections.map((part, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeSkill === index}
            className={activeSkill === index ? 'active' : ''}
            key={part.skill}
            onClick={() => setActiveSkill(index)}
          >
            {skillLabels[part.skill]}
          </button>
        ))}
      </div>
      <div className="practice-review-grid">
        <div className="practice-review-context">
          <span className="practice-kicker">NỘI DUNG ĐỀ</span>
          <h2>{examSection.title}</h2>
          {examSection.passage ? (
            <p>{examSection.passage}</p>
          ) : (
            <p>Đoạn nghe đã dùng trong bài luyện tập.</p>
          )}
        </div>
        <div className="practice-review-list">
          {section.questions.map((review, index) => (
            <article className="practice-review-card" key={review.questionId}>
              <span className="practice-question-number">CÂU {index + 1}</span>
              <h3>{examSection.questions[index]?.prompt}</h3>
              <p>
                Đáp án của bạn:{' '}
                <strong>{review.answer || 'Chưa trả lời'}</strong>
              </p>
              {review.status === 'GRADED' ? (
                <>
                  <span
                    className={
                      review.correct ? 'practice-correct' : 'practice-incorrect'
                    }
                  >
                    {review.correct ? 'Đúng' : 'Cần ôn lại'}
                  </span>
                  {!review.correct && (
                    <p>
                      Đáp án đúng: <strong>{review.correctAnswer}</strong>
                    </p>
                  )}
                  <details>
                    <summary>Giải thích đáp án</summary>
                    <p>{review.explanation}</p>
                  </details>
                </>
              ) : (
                <span className="practice-pending">
                  {review.status === 'PENDING_REVIEW'
                    ? 'Bài viết đang chờ chấm'
                    : 'Chưa nộp bài viết'}
                </span>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
