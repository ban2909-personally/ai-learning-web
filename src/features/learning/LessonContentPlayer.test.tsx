import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LessonContentPlayer } from './LessonContentPlayer'

describe('LessonContentPlayer', () => {
  it('uses native credentialed video for protected platform media', () => {
    const onPositionChange = vi.fn()
    render(<LessonContentPlayer lesson={{
      courseId: 'course-1',
      courseSlug: 'spring',
      sectionId: 'section-1',
      lessonId: 'lesson-1',
      title: 'Spring media',
      contentUrl: '/api/v1/media/courses/spring/lessons/lesson-1',
      durationSeconds: 100,
      preview: false,
    }} resumeAt={12} onPositionChange={onPositionChange} />)

    const video = screen.getByTitle('Spring media') as HTMLVideoElement
    expect(video.tagName).toBe('VIDEO')
    expect(video.crossOrigin).toBe('use-credentials')
    expect(video.src).toBe('http://localhost:8080/api/v1/media/courses/spring/lessons/lesson-1')
    expect(screen.getByText('Đang tải video...')).toBeInTheDocument()

    fireEvent.canPlay(video)
    expect(screen.queryByText('Đang tải video...')).not.toBeInTheDocument()

    Object.defineProperty(video, 'currentTime', { configurable: true, value: 18 })
    fireEvent.timeUpdate(video)
    expect(onPositionChange).toHaveBeenCalledWith(18)
  })

  it('keeps externally hosted lesson embeds compatible', () => {
    render(<LessonContentPlayer lesson={{
      courseId: 'course-1',
      courseSlug: 'spring',
      sectionId: 'section-1',
      lessonId: 'lesson-1',
      title: 'External lesson',
      contentUrl: 'https://player.example.test/video/1',
      durationSeconds: 100,
      preview: true,
    }} resumeAt={0} onPositionChange={vi.fn()} />)

    expect(screen.getByTitle('External lesson').tagName).toBe('IFRAME')
  })
})
