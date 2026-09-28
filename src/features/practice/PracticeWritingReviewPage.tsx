import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../../lib/api'
import './practice.css'

type WritingSubmission = {
  attemptId: string
  questionId: string
  examTitle: string
  prompt: string
  answer: string
  submittedAt: string
}

type Criterion =
  | 'taskScore'
  | 'coherenceScore'
  | 'vocabularyScore'
  | 'grammarScore'

const criteria: { key: Criterion; label: string; hint: string }[] = [
  {
    key: 'taskScore',
    label: 'Đáp ứng đề bài',
    hint: 'Trả lời đúng mục đích và đủ ý.',
  },
  {
    key: 'coherenceScore',
    label: 'Mạch lạc',
    hint: 'Sắp xếp ý và liên kết câu rõ ràng.',
  },
  {
    key: 'vocabularyScore',
    label: 'Từ vựng',
    hint: 'Dùng từ phù hợp với ngữ cảnh.',
  },
  {
    key: 'grammarScore',
    label: 'Ngữ pháp',
    hint: 'Cấu trúc câu chính xác và đa dạng.',
  },
]

const initialScores: Record<Criterion, number> = {
  taskScore: 0,
  coherenceScore: 0,
  vocabularyScore: 0,
  grammarScore: 0,
}

const submissionKey = (item: WritingSubmission) =>
  `${item.attemptId}:${item.questionId}`

export function PracticeWritingReviewPage() {
  const { request } = useAuth()
  const [items, setItems] = useState<WritingSubmission[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [scores, setScores] = useState(initialScores)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    request<WritingSubmission[]>('/practice/reviews/pending')
      .then((submissions) => {
        setItems(submissions)
        setSelected(submissions[0] ? submissionKey(submissions[0]) : null)
      })
      .catch(() => setError('Không thể tải bài viết chờ chấm.'))
      .finally(() => setLoading(false))
  }, [request])

  const current = items.find((item) => submissionKey(item) === selected)
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0)

  const choose = (item: WritingSubmission) => {
    setSelected(submissionKey(item))
    setScores(initialScores)
    setFeedback('')
    setError('')
    setNotice('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!current) return
    if (!feedback.trim()) {
      setError('Hãy viết nhận xét cụ thể trước khi lưu điểm.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await request(
        `/practice/attempts/${current.attemptId}/writing/${current.questionId}/review`,
        {
          method: 'PUT',
          body: JSON.stringify({ ...scores, feedback: feedback.trim() }),
        },
      )
      const remaining = items.filter(
        (item) => submissionKey(item) !== submissionKey(current),
      )
      setItems(remaining)
      setSelected(remaining[0] ? submissionKey(remaining[0]) : null)
      setScores(initialScores)
      setFeedback('')
      setNotice('Đã lưu điểm và nhận xét. Học viên có thể xem kết quả ngay.')
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Không thể lưu điểm. Vui lòng thử lại.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="practice-shell practice-reviewer">
      <span className="practice-kicker">ENGLISH WRITING · HUMAN REVIEW</span>
      <h1>Chấm bài Viết</h1>
      <p className="practice-reviewer-intro">
        Đọc bài làm, cho điểm từng tiêu chí từ 0–5 và để lại nhận xét hữu ích.
        Tổng 20 điểm chỉ là thang luyện tập của nền tảng.
      </p>
      {loading && <p role="status">Đang tải bài viết…</p>}
      {notice && (
        <p role="status" className="practice-notice">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="practice-error">
          {error}
        </p>
      )}
      {!loading && items.length === 0 && !error && (
        <div className="practice-empty">Không còn bài viết chờ chấm.</div>
      )}
      {items.length > 0 && (
        <div className="practice-reviewer-grid">
          <aside
            className="practice-reviewer-queue"
            aria-label="Bài viết chờ chấm"
          >
            <h2>
              Hàng đợi <span>{items.length}</span>
            </h2>
            {items.map((item) => (
              <button
                type="button"
                key={`${item.attemptId}-${item.questionId}`}
                className={submissionKey(item) === selected ? 'active' : ''}
                onClick={() => choose(item)}
              >
                <strong>{item.examTitle}</strong>
                <small>
                  {new Date(item.submittedAt).toLocaleString('vi-VN')}
                </small>
                <span>
                  {item.answer.slice(0, 90)}
                  {item.answer.length > 90 ? '…' : ''}
                </span>
              </button>
            ))}
          </aside>
          {current && (
            <div className="practice-reviewer-main">
              <section className="practice-reviewer-answer">
                <span className="practice-kicker">BÀI LÀM CỦA HỌC VIÊN</span>
                <h2>{current.examTitle}</h2>
                <p className="practice-reviewer-prompt">{current.prompt}</p>
                <div className="practice-reviewer-text">{current.answer}</div>
              </section>
              <form
                className="practice-rubric"
                onSubmit={(event) => void submit(event)}
              >
                <div className="practice-rubric-head">
                  <div>
                    <span className="practice-kicker">RUBRIC LUYỆN TẬP</span>
                    <h2>Đánh giá bài viết</h2>
                  </div>
                  <strong>
                    {total}
                    <small>/20</small>
                  </strong>
                </div>
                <div className="practice-rubric-grid">
                  {criteria.map(({ key, label, hint }) => (
                    <label key={key}>
                      <span>
                        <strong>{label}</strong>
                        <small>{hint}</small>
                      </span>
                      <select
                        value={scores[key]}
                        onChange={(event) =>
                          setScores((currentScores) => ({
                            ...currentScores,
                            [key]: Number(event.target.value),
                          }))
                        }
                      >
                        {[0, 1, 2, 3, 4, 5].map((score) => (
                          <option key={score} value={score}>
                            {score}/5
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <label
                  className="practice-feedback-label"
                  htmlFor="writing-feedback"
                >
                  Nhận xét cho học viên
                </label>
                <textarea
                  id="writing-feedback"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder="Nêu điểm mạnh và một bước cải thiện cụ thể…"
                  required
                />
                <div className="practice-rubric-actions">
                  <small>Điểm chấm được lưu một lần để bảo toàn lịch sử.</small>
                  <button
                    type="submit"
                    className="practice-action"
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu…' : 'Lưu điểm và nhận xét →'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
