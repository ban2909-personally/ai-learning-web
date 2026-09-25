import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/AuthContext'
import { FlashcardsPage } from './FlashcardsPage'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))
const deck = {
  id: 'deck-1',
  title: 'Java cơ bản',
  description: 'Ôn tập',
  cards: [
    { front: 'JVM là gì?', back: 'Máy ảo Java' },
    { front: 'HTTP 403?', back: 'Không có quyền' },
  ],
}
const request = vi.fn()

describe('FlashcardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    request.mockImplementation(async (path: string) =>
      path === '/me/flashcards/deck-1' ? deck : [{ ...deck, cardCount: 2 }],
    )
    vi.mocked(useAuth).mockReturnValue({
      request,
      user: null,
      accessToken: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
      stream: vi.fn(),
      upload: vi.fn(),
    })
  })

  it('loads real decks, flips faces and moves between cards', async () => {
    render(<FlashcardsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ôn tập →' }))
    expect(await screen.findByText('JVM là gì?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lật để xem đáp án' }))
    expect(screen.getByText('Máy ảo Java')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Đã nhớ ✓' }))
    expect(screen.getByText('HTTP 403?')).toBeInTheDocument()
    expect(screen.getByText('Đã nhớ 1 thẻ trong lượt này')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('persists edited card content through the API', async () => {
    render(<FlashcardsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Sửa' }))
    const fronts = await screen.findAllByLabelText('Mặt trước')
    fireEvent.change(fronts[0], { target: { value: 'Bytecode là gì?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bộ thẻ' }))
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith('/me/flashcards/deck-1', {
        method: 'PUT',
        body: JSON.stringify({
          ...deck,
          cards: [
            { front: 'Bytecode là gì?', back: 'Máy ảo Java' },
            deck.cards[1],
          ],
        }),
      }),
    )
  })
})
