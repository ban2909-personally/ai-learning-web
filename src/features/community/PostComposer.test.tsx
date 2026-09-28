import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { PostComposer } from './PostComposer'
const mocks = vi.hoisted(() => ({
  user: { id: 'user', displayName: 'Student' } as {
    id: string
    displayName: string
  } | null,
  upload: vi.fn(),
  write: vi.fn(),
}))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, upload: mocks.upload }),
}))
vi.mock('./useCommunityApi', () => ({
  useCommunityApi: () => ({ write: mocks.write }),
}))
beforeEach(() => {
  mocks.user = { id: 'user', displayName: 'Student' }
  mocks.upload.mockReset().mockResolvedValue({ id: 'post', status: 'ACTIVE' })
  mocks.write.mockReset().mockResolvedValue({ id: 'post', status: 'ACTIVE' })
})
const renderComposer = () =>
  render(
    <MemoryRouter>
      <PostComposer onPublished={vi.fn()} />
    </MemoryRouter>,
  )
it('sends selected media using POST and warns about its fourteen-day lifetime', async () => {
  renderComposer()
  fireEvent.change(screen.getByLabelText('Ảnh hoặc video bài viết'), {
    target: { files: [new File(['bytes'], 'demo.png', { type: 'image/png' })] },
  })
  expect(screen.getByText(/tự hết hạn sau 14 ngày/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))
  await waitFor(() => expect(mocks.upload).toHaveBeenCalledOnce())
  expect(mocks.upload.mock.calls[0][0]).toBe('/community/posts/media')
  expect(mocks.upload.mock.calls[0][1]).toBeInstanceOf(FormData)
  expect(mocks.upload.mock.calls[0][3]).toBe('POST')
})
it('blocks media at ten MB before contacting storage', () => {
  renderComposer()
  const file = new File(['x'], 'large.mp4', { type: 'video/mp4' })
  Object.defineProperty(file, 'size', { value: 10_000_000 })
  fireEvent.change(screen.getByLabelText('Ảnh hoặc video bài viết'), {
    target: { files: [file] },
  })
  expect(screen.getByRole('alert')).toHaveTextContent('nhỏ hơn 10 MB')
  expect(mocks.upload).not.toHaveBeenCalled()
})
it('creates a poll-only post with custom colors and a safe attachment through its contract', async () => {
  renderComposer()
  fireEvent.click(screen.getByRole('button', { name: /Bình chọn \/ bầu chọn/ }))
  fireEvent.change(screen.getByLabelText('Câu hỏi bình chọn'), {
    target: { value: 'Which skill?' },
  })
  fireEvent.change(screen.getByLabelText('Lựa chọn 1'), {
    target: { value: 'Reading' },
  })
  fireEvent.change(screen.getByLabelText('Lựa chọn 2'), {
    target: { value: 'Listening' },
  })
  fireEvent.change(screen.getByLabelText(/Link đính kèm/), {
    target: { value: 'https://example.com/enroll' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Màu bài viết' }))
  fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))
  await waitFor(() => expect(mocks.write).toHaveBeenCalledOnce())
  expect(mocks.write.mock.calls[0][2]).toMatchObject({
    body: '',
    features: {
      appearance: {
        attachmentUrl: 'https://example.com/enroll',
        backgroundColor: '#173569',
        fontColor: '#ffffff',
      },
      poll: {
        kind: 'POLL',
        question: 'Which skill?',
        options: ['Reading', 'Listening'],
      },
    },
  })
})
it('rejects duplicate choices without publishing and leaves anonymous visitors a login link', async () => {
  const view = renderComposer()
  fireEvent.click(screen.getByRole('button', { name: /Bình chọn \/ bầu chọn/ }))
  fireEvent.change(screen.getByLabelText('Câu hỏi bình chọn'), {
    target: { value: 'Skill?' },
  })
  fireEvent.change(screen.getByLabelText('Lựa chọn 1'), {
    target: { value: 'Reading' },
  })
  fireEvent.change(screen.getByLabelText('Lựa chọn 2'), {
    target: { value: ' reading ' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'lựa chọn khác nhau',
  )
  expect(mocks.write).not.toHaveBeenCalled()
  view.unmount()
  mocks.user = null
  renderComposer()
  expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute(
    'href',
    '/login',
  )
})
