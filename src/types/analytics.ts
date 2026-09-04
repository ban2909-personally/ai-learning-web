export type CourseCompletionAnalytics = {
  courseId: string
  completedLessons: number
  lastCompletedAt: string
}

export type LearningAnalytics = {
  completedLessons: number
  coursesWithCompletions: number
  lastCompletedAt: string | null
  courses: CourseCompletionAnalytics[]
}
