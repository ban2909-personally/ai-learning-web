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

export type LessonMedia = {
  courseId: string
  courseSlug: string
  lessonId: string
  contentType: string
  sizeBytes: number
  etag: string
  contentUrl: string
}

export type MentorMessageRole = 'USER' | 'ASSISTANT'

export type MentorMessage = {
  id: string
  role: MentorMessageRole
  content: string
  createdAt: string
}

export type MentorAcceptedEvent = {
  message: MentorMessage
  remainingQuota: number
}

export type MentorDeltaEvent = {
  text: string
}

export type MentorCompletedEvent = {
  message: MentorMessage
  remainingQuota: number
}

export type MentorErrorEvent = {
  code: string
  detail: string
}
