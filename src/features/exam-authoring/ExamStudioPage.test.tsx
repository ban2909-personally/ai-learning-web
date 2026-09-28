import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExamStudioPage } from './ExamStudioPage'

const auth = vi.hoisted(() => ({
  request: vi.fn(),
  user: { id: 'author', roles: ['LECTURE'] },
}))
vi.mock('../auth/AuthContext', () => ({ useAuth: () => auth }))

function open() {
  render(
    <MemoryRouter initialEntries={['/instructor/exams']}>
      <Routes>
        <Route path="/instructor/exams" element={<ExamStudioPage />} />
        <Route path="/instructor/exams/:id" element={<h1>Editor</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ExamStudioPage', () => {
  afterEach(() => {
    vi.resetAllMocks()
    auth.user.roles = ['LECTURE']
  })

  it('creates a draft and opens its editor', async () => {
    auth.request.mockImplementation(
      async (_path: string, init?: RequestInit) =>
        init ? { id: 'exam-1' } : [],
    )
    open()
    await screen.findByText('Chưa có đề trong phạm vi của bạn.')
    fireEvent.click(screen.getByRole('button', { name: '+ Tạo đề tiếng Anh' }))
    fireEvent.change(screen.getByLabelText('Tên đề'), {
      target: { value: 'Workplace English' },
    })
    fireEvent.change(screen.getByLabelText('Mã đường dẫn'), {
      target: { value: 'workplace-english' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo bản nháp' }))
    await waitFor(() =>
      expect(auth.request).toHaveBeenCalledWith('/practice/authoring/exams', {
        method: 'POST',
        body: JSON.stringify({
          slug: 'workplace-english',
          title: 'Workplace English',
          description: '',
          durationMinutes: 35,
        }),
      }),
    )
    expect(await screen.findByText('Editor')).toBeInTheDocument()
  })

  it('leader sees the review workspace without a create action', async () => {
    auth.user.roles = ['LEADER']
    auth.request.mockResolvedValue([
      {
        id: 'exam-1',
        slug: 'english-email',
        title: 'English email',
        durationMinutes: 20,
        revision: 1,
        status: 'PENDING_REVIEW',
        version: 2,
      },
    ])
    open()
    expect(await screen.findByText('Chờ duyệt')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '+ Tạo đề tiếng Anh' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mở nội dung →' })).toHaveAttribute(
      'href',
      '/instructor/exams/exam-1',
    )
  })
})
