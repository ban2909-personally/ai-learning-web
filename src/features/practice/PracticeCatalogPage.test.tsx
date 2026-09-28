import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PracticeCatalogPage } from './PracticeCatalogPage'

describe('PracticeCatalogPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows each skill once for an exam with multiple parts of the same skill', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            slug: 'multipart-reading',
            title: 'Multipart Reading',
            description: 'Two reading parts.',
            durationMinutes: 30,
            skills: ['READING', 'READING', 'LISTENING'],
          },
        ]),
        { status: 200 },
      ),
    )
    const { container } = render(
      <MemoryRouter>
        <PracticeCatalogPage />
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Multipart Reading' })
    expect(
      container.querySelectorAll('.practice-skill-list span'),
    ).toHaveLength(2)
    expect(container.querySelector('.practice-skill-list')).toHaveTextContent(
      'ĐọcNghe',
    )
  })

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
