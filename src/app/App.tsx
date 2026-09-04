import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { AuthProvider } from '../features/auth/AuthContext'
import { AuthPage } from '../features/auth/AuthPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { CourseCatalogPage } from '../features/catalog/CourseCatalogPage'
import { CourseDetailPage } from '../features/catalog/CourseDetailPage'
import { HomePage } from '../features/catalog/HomePage'
import { DashboardPage } from '../features/learning/DashboardPage'
import { MyLearningPage } from '../features/learning/MyLearningPage'
import { LessonPlayerPage } from '../features/learning/LessonPlayerPage'
import { LessonMediaManagerPage } from '../features/learning/LessonMediaManagerPage'
import { NotificationProvider } from '../features/notifications/NotificationContext'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="courses" element={<CourseCatalogPage />} />
              <Route path="courses/:slug" element={<CourseDetailPage />} />
              <Route path="login" element={<AuthPage mode="login" />} />
              <Route path="register" element={<AuthPage mode="register" />} />
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="my-learning" element={<MyLearningPage />} />
                <Route path="learn/:slug" element={<LessonPlayerPage />} />
                <Route path="instructor/courses/:slug/media" element={<LessonMediaManagerPage />} />
              </Route>
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
