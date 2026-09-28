import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { ExamEditorPage } from './ExamEditorPage'
import type { ExamRevision } from './types'

const auth = vi.hoisted(() => ({
  request: vi.fn(),
  user: { id: 'author', roles: ['LECTURE'] },
}))
vi.mock('../auth/AuthContext', () => ({ useAuth: () => auth }))

function revision(
  status: ExamRevision['status'] = 'DRAFT',
  version = 0,
): ExamRevision {
  return {
    id: 'exam-1',
    seriesId: 'series-1',
    authorId: 'author',
    revision: 1,
    status,
    version,
    exam: {
      id: 'exam-1',
      slug: 'english-email',
      title: 'English email',
      description: '',
      durationMinutes: 20,
      sections: [
        {
          skill: 'READING',
          title: 'Read an email',
          passage: 'The meeting is Tuesday.',
          audioText: null,
          questions: [
            {
              kind: 'TEXT',
              prompt: 'When is the meeting?',
              options: [],
              correctAnswer: 'Tuesday',
              explanation: 'The email says Tuesday.',
            },
          ],
        },
      ],
    },
  }
}

function open() {
  return render(
    <MemoryRouter initialEntries={['/instructor/exams/exam-1']}>
      <Routes>
        <Route path="/instructor/exams/:id" element={<ExamEditorPage />} />
        <Route path="/instructor/exams" element={<h1>Danh sách đề</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ExamEditorPage', () => {
  afterEach(() => {
    vi.resetAllMocks()
    vi.unstubAllGlobals()
    auth.user = { id: 'author', roles: ['LECTURE'] }
  })

  it('saves a draft with expected version and sends the next version for review', async () => {
    auth.request.mockImplementation(
      async (_path: string, init?: RequestInit) => {
        if (!init) return revision()
        return revision(
          init.method === 'PUT' ? 'DRAFT' : 'PENDING_REVIEW',
          init.method === 'PUT' ? 1 : 2,
        )
      },
    )
    open()
    const title = await screen.findByLabelText('Tên đề')
    fireEvent.change(title, { target: { value: 'English email updated' } })
    expect(screen.getByRole('button', { name: 'Gửi duyệt' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))
    await screen.findByText('Đã lưu bản nháp.')
    const save = auth.request.mock.calls.find(
      ([, init]) => init?.method === 'PUT',
    )
    expect(JSON.parse(save?.[1].body as string)).toMatchObject({
      expectedVersion: 0,
      title: 'English email updated',
    })
    expect(
      JSON.parse(save?.[1].body as string).sections[0].questions[0]
        .correctAnswer,
    ).toBe('Tuesday')
    fireEvent.click(screen.getByRole('button', { name: 'Gửi duyệt' }))
    await waitFor(() =>
      expect(auth.request).toHaveBeenCalledWith(
        '/practice/authoring/exams/exam-1/submit',
        {
          method: 'POST',
          body: JSON.stringify({ expectedVersion: 1 }),
        },
      ),
    )
    expect(await screen.findByText('Chờ duyệt')).toBeInTheDocument()
  })

  it('preserves local content on conflict and blocks automatic overwrite', async () => {
    auth.request.mockImplementation(
      async (_path: string, init?: RequestInit) => {
        if (init)
          throw new ApiError(
            'Phiên bản đã thay đổi.',
            409,
            'exam_revision_conflict',
          )
        return revision()
      },
    )
    open()
    const title = await screen.findByLabelText('Tên đề')
    fireEvent.change(title, { target: { value: 'Local unsaved title' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))
    await screen.findByRole('alert')
    expect(title).toHaveValue('Local unsaved title')
    expect(screen.getByRole('button', { name: 'Lưu bản nháp' })).toBeDisabled()
    expect(screen.getByText(/không ghi đè tự động/)).toBeInTheDocument()
  })

  it('leader can publish a pending revision but cannot edit answer keys', async () => {
    auth.user = { id: 'leader', roles: ['LEADER'] }
    auth.request.mockImplementation(
      async (_path: string, init?: RequestInit) =>
        init ? revision('PUBLISHED', 3) : revision('PENDING_REVIEW', 2),
    )
    open()
    const answer = await screen.findByLabelText('Đáp án đúng')
    expect(answer).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Lưu bản nháp' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt và phát hành' }))
    await waitFor(() =>
      expect(auth.request).toHaveBeenCalledWith(
        '/practice/authoring/exams/exam-1/publish',
        {
          method: 'POST',
          body: JSON.stringify({ expectedVersion: 2 }),
        },
      ),
    )
  })

  it('published content is read-only and cloning uses the current version', async () => {
    auth.request.mockImplementation(
      async (_path: string, init?: RequestInit) =>
        init
          ? { ...revision(), id: 'exam-2', revision: 2 }
          : revision('PUBLISHED', 3),
    )
    open()
    expect(await screen.findByLabelText('Tên đề')).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Gửi duyệt' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tạo phiên bản mới' }))
    await waitFor(() =>
      expect(auth.request).toHaveBeenCalledWith(
        '/practice/authoring/exams/exam-1/clone',
        {
          method: 'POST',
          body: JSON.stringify({ expectedVersion: 3 }),
        },
      ),
    )
  })

  it('can add a Writing section and does not offer an objective answer key', async () => {
    auth.request.mockResolvedValue(revision())
    open()
    await screen.findByLabelText('Tên đề')
    fireEvent.click(screen.getByRole('button', { name: '+ Thêm phần thi' }))
    fireEvent.change(screen.getByLabelText('Kỹ năng'), {
      target: { value: 'WRITING' },
    })
    fireEvent.click(screen.getByRole('button', { name: '+ Thêm câu hỏi' }))
    expect(
      screen.getByText(/Bài viết được giảng viên chấm riêng/),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Đáp án đúng')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }))
    await waitFor(() =>
      expect(auth.request).toHaveBeenCalledWith(
        '/practice/authoring/exams/exam-1',
        expect.objectContaining({ method: 'PUT' }),
      ),
    )
    const call = auth.request.mock.calls.find(
      ([, init]) => init?.method === 'PUT',
    )
    expect(
      JSON.parse(call?.[1].body as string).sections[1].questions[0],
    ).toMatchObject({
      kind: 'WRITING',
      correctAnswer: null,
      options: [],
    })
  })

  it('asks before leaving an unsaved draft through a link and keeps it on cancel', async () => {
    const confirm = vi.fn(() => false)
    vi.stubGlobal('confirm', confirm)
    auth.request.mockResolvedValue(revision())
    open()
    fireEvent.change(await screen.findByLabelText('Tên đề'), {
      target: { value: 'Unsaved local draft' },
    })
    fireEvent.click(screen.getByRole('link', { name: '← Không gian soạn đề' }))
    expect(confirm).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Tên đề')).toHaveValue('Unsaved local draft')
    expect(
      screen.queryByRole('heading', { name: 'Danh sách đề' }),
    ).not.toBeInTheDocument()
  })
})
