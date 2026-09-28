import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PracticeCatalogPage } from './PracticeCatalogPage'

describe('PracticeCatalogPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows published English practice exams to a guest', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            slug: 'english-workplace-starter',
            title: 'English Workplace Starter',
            description: 'Nghe, đọc và viết trong công việc.',
            durationMinutes: 35,
            skills: ['LISTENING', 'READING', 'WRITING'],
          },
        ]),
        { status: 200 },
      ),
    )

    render(
      <MemoryRouter>
        <PracticeCatalogPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'English Workplace Starter' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Xem đề và bắt đầu/ }),
    ).toHaveAttribute('href', '/practice/exams/english-workplace-starter')
    expect(screen.getByText(/không phải chứng chỉ TOEIC/)).toBeInTheDocument()
  })
})
