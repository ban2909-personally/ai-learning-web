import type { CourseSummary } from './catalog'

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export type Enrollment = {
  id: string
  status: EnrollmentStatus
  enrolledAt: string
  course: CourseSummary
}

export type CurriculumLesson = {
  id: string
  title: string
  durationSeconds: number
  preview: boolean
  contentUrl: string | null
  order: number
}

export type CurriculumSection = {
  id: string
  title: string
  order: number
  lessons: CurriculumLesson[]
}

export type CourseCurriculum = {
  courseId: string
  courseSlug: string
  courseTitle: string
  sections: CurriculumSection[]
}

export type LessonPlayer = {
  courseId: string
  courseSlug: string
  sectionId: string
  lessonId: string
  title: string
  contentUrl: string
  durationSeconds: number
  preview: boolean
}

export type LessonProgress = {
  lessonId: string
  positionSeconds: number
  completed: boolean
  updatedAt: string | null
}
