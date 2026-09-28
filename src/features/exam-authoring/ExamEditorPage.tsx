import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { authorRoles, hasRole, reviewRoles } from '../auth/roles'
import { skillLabels } from '../practice/types'
import { ApiError } from '../../lib/api'
import { ExamSectionEditor } from './ExamSectionEditor'
import {
  revisionLabels,
  type DraftContent,
  type DraftSection,
  type ExamRevision,
} from './types'
import './exam-authoring.css'

export function ExamEditorPage() {
  const { id } = useParams()
  const { request, user } = useAuth()
  const navigate = useNavigate()
  const [revision, setRevision] = useState<ExamRevision | null>(null)
  const [content, setContent] = useState<DraftContent | null>(null)
  const [selected, setSelected] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [conflict, setConflict] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const apply = useCallback((result: ExamRevision) => {
    setRevision(result)
    setContent({
      title: result.exam.title,
      description: result.exam.description,
      durationMinutes: result.exam.durationMinutes,
      sections: result.exam.sections.map((s) => ({
        skill: s.skill,
        title: s.title,
        passage: s.passage,
        audioText: s.audioText,
        questions: s.questions.map((q) => ({
          kind: q.kind,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      })),
    })
    setDirty(false)
    setConflict(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setRevision(null)
    setContent(null)
    setError('')
    request<ExamRevision>('/practice/authoring/exams/' + id)
      .then((result) => {
        if (!cancelled) {
          apply(result)
          setSelected(0)
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled)
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Không thể mở đề thi.',
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [request, id, apply])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const guardNavigation = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        'a[href]',
      )
      if (!link || link.target === '_blank' || link.hasAttribute('download'))
        return
      const next = new URL(link.href)
      if (
        next.origin !== window.location.origin ||
        next.pathname === window.location.pathname
      )
        return
      if (!window.confirm('Bản nháp chưa lưu. Rời trang và bỏ thay đổi?')) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', guardNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('click', guardNavigation, true)
    }
  }, [dirty])

  const canManage = Boolean(
    revision &&
      hasRole(user?.roles, authorRoles) &&
      (user?.roles.includes('ADMIN') || revision.authorId === user?.id),
  )
  const editable = revision?.status === 'DRAFT' && canManage
  const count =
    content?.sections.reduce((sum, s) => sum + s.questions.length, 0) ?? 0
  const change = (next: DraftContent) => {
    setContent(next)
    setDirty(true)
    setNotice('')
  }
  const section = (next: DraftSection) => {
    if (!content) return
    change({
      ...content,
      sections: content.sections.map((s, index) =>
        index === selected ? next : s,
      ),
    })
  }

  const mutate = async (
    action: 'save' | 'submit' | 'withdraw' | 'publish' | 'clone',
  ) => {
    if (!revision || !content || busy || conflict) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<ExamRevision>(
        '/practice/authoring/exams/' +
          revision.id +
          (action === 'save' ? '' : '/' + action),
        {
          method: action === 'save' ? 'PUT' : 'POST',
          body: JSON.stringify(
            action === 'save'
              ? { expectedVersion: revision.version, ...content }
              : { expectedVersion: revision.version },
          ),
        },
      )
      apply(result)
      setNotice(
        action === 'save' ? 'Đã lưu bản nháp.' : 'Đã cập nhật trạng thái đề.',
      )
      if (action === 'clone') navigate('/instructor/exams/' + result.id)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) setConflict(true)
      setError(
        caught instanceof ApiError ? caught.message : 'Không thể lưu thay đổi.',
      )
    } finally {
      setBusy(false)
    }
  }

  const reload = async () => {
    if (
      dirty &&
      !window.confirm('Tải lại sẽ bỏ thay đổi chưa lưu của bạn. Tiếp tục?')
    )
      return
    setBusy(true)
    setError('')
    try {
      apply(await request<ExamRevision>('/practice/authoring/exams/' + id))
      setSelected(0)
      setNotice('Đã tải phiên bản mới nhất.')
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Không thể tải lại đề.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading)
    return (
      <main className="exam-studio">
        <p role="status">Đang mở đề thi…</p>
      </main>
    )
  if (!revision || !content)
    return (
      <main className="exam-studio">
        <p role="alert" className="error-notice">
          {error}
        </p>
        <Link to="/instructor/exams">Về danh sách đề</Link>
      </main>
    )
  const current = content.sections[selected]
  return (
    <main className="exam-studio exam-editor">
      <Link className="exam-back-link" to="/instructor/exams">
        ← Không gian soạn đề
      </Link>
      <header className="exam-studio-heading">
        <div>
          <p className="exam-eyebrow">
            PHIÊN BẢN {revision.revision} · {revision.exam.slug}
          </p>
          <h1>{revision.exam.title}</h1>
          <p>
            Đề đã phát hành không sửa trực tiếp. Hãy tạo phiên bản mới để giữ
            nguyên kết quả cũ.
          </p>
        </div>
        <span className={'exam-status exam-status-' + revision.status}>
          {revisionLabels[revision.status]}
        </span>
      </header>
      <div className="exam-editor-toolbar">
        <span role="status">
          {busy
            ? 'Đang xử lý…'
            : dirty
              ? 'Có thay đổi chưa lưu'
              : 'Nội dung đã đồng bộ'}{' '}
          · {count}/250 câu
        </span>
        <div>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => void reload()}
          >
            Tải lại
          </button>
          {editable && (
            <button
              className="primary-button"
              disabled={!dirty || busy || conflict}
              onClick={() => void mutate('save')}
            >
              Lưu bản nháp
            </button>
          )}
          {editable && (
            <button
              className="secondary-button"
              disabled={dirty || busy || conflict}
              onClick={() => void mutate('submit')}
            >
              Gửi duyệt
            </button>
          )}
          {revision.status === 'PENDING_REVIEW' && canManage && (
            <button
              className="secondary-button"
              disabled={busy || conflict}
              onClick={() => void mutate('withdraw')}
            >
              Rút về bản nháp
            </button>
          )}
          {revision.status === 'PENDING_REVIEW' &&
            hasRole(user?.roles, reviewRoles) && (
              <button
                className="primary-button"
                disabled={busy || conflict}
                onClick={() => void mutate('publish')}
              >
                Duyệt và phát hành
              </button>
            )}
          {revision.status === 'PUBLISHED' && canManage && (
            <button
              className="primary-button"
              disabled={busy || conflict}
              onClick={() => void mutate('clone')}
            >
              Tạo phiên bản mới
            </button>
          )}
        </div>
      </div>
      {notice && (
        <p role="status" className="exam-success">
          {notice}
        </p>
      )}
      {error && (
        <div role="alert" className="error-notice">
          {error}
          {conflict && (
            <p>
              Thay đổi của bạn vẫn được giữ trên màn hình. Tải lại để xem phiên
              bản hiện tại; không ghi đè tự động.
            </p>
          )}
        </div>
      )}
      <div className="exam-editor-grid">
        <aside className="exam-editor-sidebar">
          <h2>Cấu trúc đề</h2>
          <nav aria-label="Các phần đề thi">
            {content.sections.map((s, index) => (
              <button
                type="button"
                key={index}
                className={selected === index ? 'active' : ''}
                aria-current={selected === index ? 'step' : undefined}
                onClick={() => setSelected(index)}
              >
                <span>{index + 1}</span>
                <div>
                  <strong>{s.title || skillLabels[s.skill]}</strong>
                  <small>
                    {skillLabels[s.skill]} · {s.questions.length} câu
                  </small>
                </div>
              </button>
            ))}
          </nav>
          {editable && (
            <button
              className="secondary-button"
              disabled={busy || conflict || content.sections.length >= 20}
              onClick={() => {
                change({
                  ...content,
                  sections: [
                    ...content.sections,
                    {
                      skill: 'READING',
                      title: '',
                      passage: '',
                      audioText: null,
                      questions: [],
                    },
                  ],
                })
                setSelected(content.sections.length)
              }}
            >
              + Thêm phần thi
            </button>
          )}
          <p>
            Listening, Reading, Writing.
            <br />
            Speaking chưa thuộc phạm vi.
          </p>
        </aside>
        <div className="exam-editor-main">
          <section className="exam-metadata-card">
            <h2>Thông tin đề thi</h2>
            <fieldset disabled={!editable || busy || conflict}>
              <div className="exam-field-grid">
                <label>
                  Tên đề
                  <input
                    value={content.title}
                    maxLength={180}
                    onChange={(event) =>
                      change({ ...content, title: event.target.value })
                    }
                  />
                </label>
                <label>
                  Thời lượng (phút)
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={content.durationMinutes}
                    onChange={(event) =>
                      change({
                        ...content,
                        durationMinutes: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <label>
                Mô tả
                <textarea
                  value={content.description}
                  rows={2}
                  maxLength={1000}
                  onChange={(event) =>
                    change({ ...content, description: event.target.value })
                  }
                />
              </label>
            </fieldset>
          </section>
          {current ? (
            <ExamSectionEditor
              section={current}
              index={selected}
              disabled={!editable || conflict}
              busy={busy}
              totalQuestions={count}
              onChange={section}
              onRemove={() => {
                if (
                  !window.confirm('Xóa phần thi và các câu hỏi trong phần này?')
                )
                  return
                change({
                  ...content,
                  sections: content.sections.filter(
                    (_, index) => index !== selected,
                  ),
                })
                setSelected(Math.max(0, selected - 1))
              }}
            />
          ) : (
            <section className="exam-metadata-card empty-state">
              Thêm phần thi đầu tiên để bắt đầu soạn nội dung.
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
