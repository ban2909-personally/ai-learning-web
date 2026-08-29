import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CourseCurriculum } from './CourseCurriculum'

const curriculum = {
  courseId: 'course-1', courseSlug: 'spring', courseTitle: 'Spring',
  sections: [{ id: 'section-1', title: 'Khởi động', order: 0, lessons: [
    { id: 'lesson-1', title: 'Giới thiệu', durationSeconds: 90, preview: true, contentUrl: 'https://video.test/1', order: 0 },
    { id: 'lesson-2', title: 'Cấu hình', durationSeconds: 180, preview: false, contentUrl: null, order: 1 },
  ] }],
}

describe('CourseCurriculum', () => {
  it('renders lesson metadata and selects a lesson', () => {
    const select = vi.fn()
    render(<CourseCurriculum curriculum={curriculum} onSelectLesson={select} />)

    expect(screen.getByText('Xem thử')).toBeInTheDocument()
    expect(screen.getByText('2 phút')).toBeInTheDocument()
    screen.getByRole('button', { name: /Cấu hình/ }).click()
    expect(select).toHaveBeenCalledWith('lesson-2')
  })
})
