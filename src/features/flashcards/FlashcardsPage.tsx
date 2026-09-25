import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { WorkspaceIcon } from '../../components/WorkspaceIcon'

type Card = { front: string; back: string }
type Deck = { id?: string; title: string; description: string; cards: Card[] }
type DeckSummary = {
  id: string
  title: string
  description: string
  cardCount: number
}
export function FlashcardsPage() {
  const { request } = useAuth()
  const [decks, setDecks] = useState<DeckSummary[]>([])
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState<Deck | null>(null)
  const [study, setStudy] = useState<Deck | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    try {
      setDecks(
        await request<DeckSummary[]>(
          '/me/flashcards?search=' + encodeURIComponent(search),
        ),
      )
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Không thể tải bộ thẻ.',
      )
    }
  }, [request, search])
  useEffect(() => {
    void load()
  }, [load])
  const open = async (id: string, editing: boolean) => {
    setError('')
    try {
      const deck = await request<Deck>('/me/flashcards/' + id)
      if (editing) setEditor(deck)
      else setStudy(deck)
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Không thể mở bộ thẻ.',
      )
    }
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!editor) return
    setBusy(true)
    setError('')
    try {
      await request('/me/flashcards' + (editor.id ? '/' + editor.id : ''), {
        method: editor.id ? 'PUT' : 'POST',
        body: JSON.stringify(editor),
      })
      setEditor(null)
      await load()
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Không thể lưu bộ thẻ.',
      )
    } finally {
      setBusy(false)
    }
  }
  const remove = async (id: string) => {
    if (!window.confirm('Xóa bộ thẻ này? Bạn sẽ mất toàn bộ thẻ bên trong.'))
      return
    try {
      await request('/me/flashcards/' + id, { method: 'DELETE' })
      await load()
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Không thể xóa bộ thẻ.',
      )
    }
  }
  return (
    <main className="page-container">
      <div className="page-heading">
        <div>
          <p className="eyebrow">GHI NHỚ CHỦ ĐỘNG</p>
          <h1>Thẻ ghi nhớ</h1>
          <p>Mỗi lần lật thẻ là một lần củng cố kiến thức của bạn.</p>
        </div>
        <button
          className="primary-button"
          onClick={() =>
            setEditor({
              title: '',
              description: '',
              cards: [
                { front: '', back: '' },
                { front: '', back: '' },
              ],
            })
          }
        >
          + Tạo bộ thẻ mới
        </button>
      </div>
      {error && (
        <div role="alert" className="error-notice">
          {error}
        </div>
      )}
      {editor ? (
        <form onSubmit={save} className="workspace-panel p-6">
          <div className="form-grid">
            <label>
              Tên bộ thẻ
              <input
                className="field"
                required
                maxLength={180}
                value={editor.title}
                onChange={(event) =>
                  setEditor({ ...editor, title: event.target.value })
                }
              />
            </label>
            <label>
              Mô tả
              <input
                className="field"
                maxLength={1000}
                value={editor.description}
                onChange={(event) =>
                  setEditor({ ...editor, description: event.target.value })
                }
              />
            </label>
          </div>
          <div className="space-y-4 mt-6">
            {editor.cards.map((card, index) => (
              <div className="flashcard-editor-row" key={index}>
                <span>{index + 1}</span>
                <label>
                  Mặt trước
                  <textarea
                    className="field"
                    required
                    maxLength={2000}
                    value={card.front}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        cards: editor.cards.map((value, i) =>
                          i === index
                            ? { ...value, front: event.target.value }
                            : value,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Mặt sau
                  <textarea
                    className="field"
                    required
                    maxLength={4000}
                    value={card.back}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        cards: editor.cards.map((value, i) =>
                          i === index
                            ? { ...value, back: event.target.value }
                            : value,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="text-button"
                  disabled={editor.cards.length === 1}
                  onClick={() =>
                    setEditor({
                      ...editor,
                      cards: editor.cards.filter((_, i) => i !== index),
                    })
                  }
                >
                  Bỏ thẻ
                </button>
              </div>
            ))}
          </div>
          <div className="form-actions mt-6">
            <button
              type="button"
              className="secondary-button"
              disabled={editor.cards.length >= 200}
              onClick={() =>
                setEditor({
                  ...editor,
                  cards: [...editor.cards, { front: '', back: '' }],
                })
              }
            >
              + Thêm thẻ
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditor(null)}
            >
              Hủy
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Đang lưu...' : 'Lưu bộ thẻ'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="filter-bar">
            <input
              className="field"
              aria-label="Tìm bộ thẻ"
              placeholder="Tìm theo tên bộ thẻ..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <span className="text-sm text-slate-500">
              {decks.length} bộ thẻ
            </span>
          </div>
          <div className="deck-grid">
            {decks.map((deck) => (
              <article key={deck.id} className="workspace-panel deck-card">
                <div className="flex items-center justify-between">
                  <span className="deck-icon">
                    <WorkspaceIcon name="cards" />
                  </span>
                  <span className="status-badge">{deck.cardCount} thẻ</span>
                </div>
                <h2>{deck.title}</h2>
                <p>{deck.description || 'Bộ thẻ cá nhân của bạn'}</p>
                <div className="form-actions">
                  <button
                    className="primary-button"
                    onClick={() => void open(deck.id, false)}
                  >
                    Ôn tập →
                  </button>
                  <button
                    className="text-button"
                    onClick={() => void open(deck.id, true)}
                  >
                    Sửa
                  </button>
                  <button
                    className="text-button text-red-600"
                    onClick={() => void remove(deck.id)}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!decks.length && (
            <div className="empty-state">
              <WorkspaceIcon name="cards" />
              <h2>Kiến thức đáng nhớ, bắt đầu từ một bộ thẻ</h2>
              <p>Tạo bộ thẻ đầu tiên để luyện ghi nhớ theo cách của bạn.</p>
            </div>
          )}
        </>
      )}
      {study && <FlashcardStudy deck={study} onClose={() => setStudy(null)} />}
    </main>
  )
}
function FlashcardStudy({
  deck,
  onClose,
}: {
  deck: Deck
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    dialog.current?.querySelector('button')?.focus()
    return () => previousFocus?.focus()
  }, [])
  const move = (direction: number) => {
    setIndex(
      (current) =>
        (current + direction + deck.cards.length) % deck.cards.length,
    )
    setFlipped(false)
  }
  return (
    <div
      className="study-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={'Ôn tập ' + deck.title}
      ref={dialog}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
        if (event.key !== 'Tab') return
        const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>(
          'button:not(:disabled)',
        )
        if (!buttons?.length) return
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
    >
      <section className="study-dialog">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">FLASHCARD · ÔN TẬP</p>
            <h2>{deck.title}</h2>
          </div>
          <button className="secondary-button" onClick={onClose}>
            Đóng
          </button>
        </div>
        <div className="study-progress">
          <span>
            Thẻ {index + 1} / {deck.cards.length}
          </span>
          <span>Đã nhớ {known.size} thẻ trong lượt này</span>
        </div>
        <button
          className={'study-card ' + (flipped ? 'is-flipped' : '')}
          onClick={() => setFlipped(!flipped)}
          aria-label={flipped ? 'Lật về câu hỏi' : 'Lật để xem đáp án'}
        >
          <small>{flipped ? 'ĐÁP ÁN' : 'CÂU HỎI'}</small>
          <span>
            {flipped ? deck.cards[index].back : deck.cards[index].front}
          </span>
          <em>Nhấn để lật thẻ</em>
        </button>
        <div className="form-actions justify-center">
          <button className="secondary-button" onClick={() => move(-1)}>
            ← Trước
          </button>
          <button
            className="primary-button"
            onClick={() => {
              setKnown((current) => new Set([...current, index]))
              move(1)
            }}
          >
            Đã nhớ ✓
          </button>
          <button className="secondary-button" onClick={() => move(1)}>
            Tiếp →
          </button>
        </div>
      </section>
    </div>
  )
}
