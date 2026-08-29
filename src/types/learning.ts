import type { CourseSummary } from './catalog'

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export type Enrollment = {
  id: string
  status: EnrollmentStatus
  enrolledAt: string
  course: CourseSummary
}
