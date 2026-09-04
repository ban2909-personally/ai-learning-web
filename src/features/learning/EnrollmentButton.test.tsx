import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/AuthContext'
import { EnrollmentButton } from './EnrollmentButton'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))
const mockedUseAuth = vi.mocked(useAuth)

describe('EnrollmentButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('enrolls an authenticated student and navigates to My Learning', async () => {
    const request = vi.fn().mockResolvedValue({ id: 'enrollment-1' })
    mockedUseAuth.mockReturnValue({
      user: { id: 'student-1', email: 'student@example.com', displayName: 'Bản Test', roles: ['STUDENT'] },
      accessToken: 'token', isLoading: false, request,
      getAccessToken: vi.fn().mockResolvedValue('token'),
      stream: vi.fn(), upload: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/courses/java-free']}>
        <Routes>
          <Route path="/courses/java-free" element={<EnrollmentButton courseSlug="java-free" price={0} />} />
          <Route path="/my-learning" element={<h1>Khóa học của tôi</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ghi danh miễn phí' }))
    await waitFor(() => expect(request).toHaveBeenCalledWith(
      '/courses/java-free/enrollments', { method: 'POST' },
    ))
    expect(await screen.findByRole('heading', { name: 'Khóa học của tôi' })).toBeInTheDocument()
  })
})
