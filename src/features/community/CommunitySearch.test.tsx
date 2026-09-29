import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunitySearch } from './CommunitySearch'

const { read } = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('./useCommunityApi', () => ({ useCommunityApi: () => ({ read }) }))
const empty = {
  spaces: [],
  people: [],
  spacesHasMore: false,
  peopleHasMore: false,
  page: 0,
}
function show() {
  render(
    <MemoryRouter>
      <CommunitySearch />
    </MemoryRouter>,
  )
  return screen.getByRole('searchbox')
}

describe('CommunitySearch', () => {
  beforeEach(() => {
    read.mockReset().mockResolvedValue(empty)
  })

  it('starts from one character, debounces typing and links groups/pages/people', async () => {
    read.mockResolvedValue({
      ...empty,
      spaces: [
        {
          id: 'group',
          name: 'Hội trí tuệ nhân tạo',
          kind: 'GROUP',
          visibility: 'PRIVATE',
        },
        { id: 'page', name: 'English Hub', kind: 'PAGE', visibility: 'PUBLIC' },
      ],
      people: [{ id: 'person', displayName: 'Hà Anh' }],
    })
    const input = show()
    expect(
      screen.getByRole('region', { name: 'Tìm kiếm trên nền tảng' }),
    ).toHaveClass('community-discovery')
    expect(read).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: 'h' } })
    fireEvent.change(input, { target: { value: 'ha' } })
    expect(read).not.toHaveBeenCalled()
    expect(await screen.findByRole('link', { name: /Hà Anh/ })).toHaveAttribute(
      'href',
      '/community/people/person',
    )
    expect(read).toHaveBeenCalledOnce()
    expect(read).toHaveBeenCalledWith('/community/search?q=ha&page=0', {
      signal: expect.any(AbortSignal),
    })
    expect(screen.getByRole('link', { name: /Hội trí tuệ/ })).toHaveTextContent(
      'cần phê duyệt',
    )
    fireEvent.click(screen.getByRole('button', { name: /^Page$/ }))
    expect(
      screen.getByRole('link', { name: /English Hub/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Hà Anh/ }),
    ).not.toBeInTheDocument()
  })

  it('cancels obsolete requests and ignores their late responses', async () => {
    let resolveOld!: (value: unknown) => void
    read
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve
          }),
      )
      .mockResolvedValue({
        ...empty,
        people: [{ id: 'new', displayName: 'Newest' }],
      })
    const input = show()
    fireEvent.change(input, { target: { value: 'n' } })
    await waitFor(() => expect(read).toHaveBeenCalledOnce())
    const signal = read.mock.calls[0][1].signal as AbortSignal
    fireEvent.change(input, { target: { value: 'new' } })
    expect(signal.aborted).toBe(true)
    await screen.findByRole('link', { name: /Newest/ })
    await act(async () =>
      resolveOld({
        ...empty,
        people: [{ id: 'old', displayName: 'Old result' }],
      }),
    )
    expect(screen.queryByText('Old result')).not.toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveValue('')
    expect(screen.queryByText('Newest')).not.toBeInTheDocument()
  })

  it('has empty and retry states, preserves results while paging without duplicates', async () => {
    read
      .mockRejectedValueOnce(new Error('Mất kết nối'))
      .mockResolvedValueOnce({
        ...empty,
        people: [{ id: 'a', displayName: 'Anh' }],
        peopleHasMore: true,
      })
      .mockResolvedValueOnce({
        ...empty,
        page: 1,
        people: [
          { id: 'a', displayName: 'Anh' },
          { id: 'b', displayName: 'Bình' },
        ],
      })
    fireEvent.change(show(), { target: { value: 'a' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối')
    fireEvent.click(screen.getByRole('button', { name: 'Thử tìm lại' }))
    await screen.findByRole('link', { name: /Anh/ })
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm kết quả' }))
    await screen.findByRole('link', { name: /Bình/ })
    expect(screen.getAllByRole('link', { name: /Anh/ })).toHaveLength(1)
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'zzz' },
    })
    expect(
      await screen.findByText(/Chưa có kết quả phù hợp/),
    ).toBeInTheDocument()
  })
})
