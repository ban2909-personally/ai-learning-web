import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EnglishResourcesPage } from './EnglishResourcesPage'
import { englishResources } from './englishResources'

describe('EnglishResourcesPage', () => {
  it('shows original verified provider links without embeds or rehosted content', () => {
    const { container } = render(<EnglishResourcesPage />)
    expect(screen.getByRole('status')).toHaveTextContent('10 học liệu')
    expect(screen.getAllByRole('link')).toHaveLength(englishResources.length)
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link.getAttribute('href')).toMatch(/^https:\/\//)
    }
    expect(container.querySelector('iframe,video,img')).toBeNull()
    expect(screen.getByText(/Test Zone IELTS\/B2/)).toHaveTextContent('trả phí')
  })

  it('combines accent-insensitive keyword, skill and format filters then resets', () => {
    render(<EnglishResourcesPage />)
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'NGU PHAP' },
    })
    expect(screen.getByRole('status')).toHaveTextContent('3 học liệu')
    fireEvent.change(screen.getByRole('combobox', { name: 'Loại học liệu' }), {
      target: { value: 'Bài tập' },
    })
    expect(screen.getByRole('status')).toHaveTextContent('2 học liệu')
    fireEvent.change(screen.getByRole('combobox', { name: 'Kỹ năng' }), {
      target: { value: 'Luyện thi' },
    })
    expect(screen.getByText(/Không có học liệu phù hợp/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))
    expect(screen.getByRole('status')).toHaveTextContent('10 học liệu')
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'toeic' },
    })
    expect(screen.getByRole('status')).toHaveTextContent('1 học liệu')
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://www.ets.org/toeic/test-takers/prepare.html',
    )
  })
})
