import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { skillLabels, type Attempt, type Question } from './types'
import './practice.css'

export function PracticeAttemptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { request } = useAuth()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [sectionIndex, setSectionIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    request<Attempt>(`/practice/attempts/${id}`)
      .then((data) => {
        setAttempt(data)
        setAnswers(data.answers)
      })
      .catch(() => setError('Không thể tải lượt làm bài.'))
    return () => window.speechSynthesis?.cancel()
  }, [id, request])

  const save = async (question: Question, answer: string) => {
    if (!id) return
    setBusy(true)
    setError('')
    try {
      await request(`/practice/attempts/${id}/answers/${question.id}`, {
        method: 'PUT',
        body: JSON.stringify({ answer }),
      })
      setAnswers((current) => ({ ...current, [question.id]: answer }))
    } catch {
      setError('Chưa lưu được đáp án. Vui lòng thử lại trước khi nộp bài.')
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    if (!id || !attempt) return
    setBusy(true)
    setError('')
    try {
      for (const section of attempt.exam.sections) {
        for (const question of section.questions) {
          const answer = answers[question.id] ?? ''
          if (answer !== (attempt.answers[question.id] ?? '')) {
            await request(`/practice/attempts/${id}/answers/${question.id}`, {
              method: 'PUT',
              body: JSON.stringify({ answer }),
            })
          }
        }
      }
      await request(`/practice/attempts/${id}/submit`, { method: 'POST' })
      window.speechSynthesis?.cancel()
      navigate(`/practice/attempts/${id}/result`)
    } catch {
      setError(
        'Nộp bài chưa thành công. Đáp án của bạn vẫn được giữ trên trang; hãy thử lại.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (error && !attempt)
    return (
      <main className="practice-shell">
        <p role="alert" className="practice-error">
          {error}
        </p>
      </main>
    )
  if (!attempt)
    return (
      <main className="practice-shell">
        <p>Đang tải bài làm…</p>
      </main>
    )
  if (attempt.status === 'SUBMITTED')
    return (
      <main className="practice-shell">
        <Link
          to={`/practice/attempts/${id}/result`}
          className="practice-action"
        >
          Xem kết quả →
        </Link>
      </main>
    )

  const section = attempt.exam.sections[sectionIndex]
  const allQuestions = attempt.exam.sections.flatMap((part) => part.questions)
  const completed = allQuestions.filter((question) =>
    (answers[question.id] ?? '').trim(),
  ).length
  const playAudio = () => {
    if (!section.audioText || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const speech = new SpeechSynthesisUtterance(section.audioText)
    speech.lang = 'en-US'
    speech.rate = 0.9
    window.speechSynthesis.speak(speech)
  }

  return (
    <main className="practice-workspace">
      <aside className="practice-workspace-side">
        <Link to="/practice" className="practice-back">
          ← Đề luyện tập
        </Link>
        <span className="practice-kicker">ĐANG LÀM BÀI</span>
        <h1>{attempt.exam.title}</h1>
        <div className="practice-progress">
          <strong>
            {completed}/{allQuestions.length}
          </strong>
          <span>câu đã trả lời</span>
        </div>
        <div className="practice-progress-track">
          <span
            style={{
              width: `${allQuestions.length ? (completed / allQuestions.length) * 100 : 0}%`,
            }}
          />
        </div>
        <nav aria-label="Phần thi" className="practice-section-nav">
          {attempt.exam.sections.map((part, index) => (
            <button
              key={part.id}
              type="button"
              className={index === sectionIndex ? 'active' : ''}
              onClick={() => {
                window.speechSynthesis?.cancel()
                setSectionIndex(index)
              }}
            >
              <span>0{index + 1}</span>
              <strong>{skillLabels[part.skill]}</strong>
              <small>{part.questions.length} câu</small>
            </button>
          ))}
        </nav>
        <p className="practice-side-note">
          Điểm luyện tập chỉ tính câu Nghe và Đọc. Bài Viết chờ chấm.
        </p>
      </aside>
      <div className="practice-workspace-main">
        <div className="practice-exam-toolbar">
          <span>
            {skillLabels[section.skill]} / {section.title}
          </span>
          <span>{attempt.exam.durationMinutes} phút dự kiến</span>
        </div>
        {error && (
          <p role="alert" className="practice-error">
            {error}
          </p>
        )}
        <div className="practice-section-content">
          <div className="practice-stimulus">
            <span className="practice-kicker">
              {skillLabels[section.skill].toUpperCase()} · PART{' '}
              {sectionIndex + 1}
            </span>
            <h2>{section.title}</h2>
            {section.skill === 'LISTENING' && (
              <div className="practice-audio">
                <span aria-hidden="true">♪</span>
                <div>
                  <strong>Đoạn nghe tiếng Anh</strong>
                  <small>Giọng đọc tổng hợp cho đề minh họa</small>
                </div>
                <button
                  type="button"
                  onClick={playAudio}
                  disabled={
                    !section.audioText || !('speechSynthesis' in window)
                  }
                  aria-label="Phát đoạn nghe"
                >
                  ▶ Phát
                </button>
              </div>
            )}
            {section.passage && (
              <div className="practice-passage">{section.passage}</div>
            )}
            {section.skill === 'LISTENING' && (
              <p>Nghe đoạn thông báo, sau đó chọn đáp án đúng cho từng câu.</p>
            )}
            {section.skill === 'WRITING' && (
              <p>
                Viết câu trả lời của bạn bằng tiếng Anh. Bài viết không được
                chấm tự động.
              </p>
            )}
          </div>
          <div className="practice-questions">
            {section.questions.map((question, index) => (
              <div className="practice-question" key={question.id}>
                <span className="practice-question-number">
                  CÂU {index + 1}
                </span>
                <h3>{question.prompt}</h3>
                {question.kind === 'CHOICE' ? (
                  <div className="practice-options">
                    {question.options.map((option, optionIndex) => (
                      <button
                        type="button"
                        key={option}
                        className={
                          answers[question.id] === option ? 'selected' : ''
                        }
                        disabled={busy}
                        aria-pressed={answers[question.id] === option}
                        onClick={() => void save(question, option)}
                      >
                        <span>{String.fromCharCode(65 + optionIndex)}</span>
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <textarea
                      rows={question.kind === 'WRITING' ? 9 : 3}
                      maxLength={question.kind === 'WRITING' ? 10000 : 500}
                      aria-label={`Đáp án câu ${index + 1}`}
                      value={answers[question.id] ?? ''}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value,
                        }))
                      }
                      onBlur={() =>
                        void save(question, answers[question.id] ?? '')
                      }
                      placeholder="Viết câu trả lời bằng tiếng Anh…"
                    />
                    {question.kind === 'WRITING' && (
                      <small>
                        {
                          (answers[question.id] ?? '')
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean).length
                        }{' '}
                        từ · Gợi ý 80–120 từ
                      </small>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <footer className="practice-exam-footer">
          <button
            type="button"
            disabled={sectionIndex === 0}
            onClick={() => setSectionIndex(sectionIndex - 1)}
          >
            ← Phần trước
          </button>
          <span>
            {busy ? 'Đang lưu…' : 'Đáp án được lưu khi chọn hoặc rời ô nhập'}
          </span>
          {sectionIndex < attempt.exam.sections.length - 1 ? (
            <button
              type="button"
              onClick={() => setSectionIndex(sectionIndex + 1)}
            >
              Phần tiếp →
            </button>
          ) : (
            <button
              type="button"
              className="practice-action"
              disabled={busy}
              onClick={() => void submit()}
            >
              Nộp bài →
            </button>
          )}
        </footer>
      </div>
    </main>
  )
}
