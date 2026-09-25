import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { AuthProvider } from '../features/auth/AuthContext'
import { AuthPage } from '../features/auth/AuthPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { CourseCatalogPage } from '../features/catalog/CourseCatalogPage'
import { CourseDetailPage } from '../features/catalog/CourseDetailPage'
import { HomePage } from '../features/catalog/HomePage'
import { LearningInsightsPage } from '../features/analytics/LearningInsightsPage'
import { MyLearningPage } from '../features/learning/MyLearningPage'
import { LessonPlayerPage } from '../features/learning/LessonPlayerPage'
import { LessonMediaManagerPage } from '../features/learning/LessonMediaManagerPage'
import { NotificationProvider } from '../features/notifications/NotificationContext'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { RoleRoute } from '../features/auth/RoleRoute'
import {
  authorRoles,
  reviewRoles,
  workspaceRoles,
  landingPage,
} from '../features/auth/roles'
import { AdminLayout } from '../features/admin/AdminLayout'
import { AdminDashboard } from '../features/admin/AdminDashboard'
import { AccountsPage } from '../features/admin/AccountsPage'
import { PermissionsPage } from '../features/admin/PermissionsPage'
import { CourseStudioPage } from '../features/authoring/CourseStudioPage'
import { FlashcardsPage } from '../features/flashcards/FlashcardsPage'
import { WorkspaceHome } from '../features/home/WorkspaceHome'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomeRoute />} />
              <Route path="courses" element={<CourseCatalogPage />} />
              <Route path="courses/:slug" element={<CourseDetailPage />} />
              <Route path="login" element={<AuthPage mode="login" />} />
              <Route path="register" element={<AuthPage mode="register" />} />
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardRoute />} />
              </Route>
              <Route element={<RoleRoute roles={workspaceRoles} />}>
                <Route path="my-learning" element={<MyLearningPage />} />
                <Route path="learn/:slug" element={<LessonPlayerPage />} />
                <Route path="flashcards" element={<FlashcardsPage />} />
              </Route>
              <Route
                element={<RoleRoute roles={[...authorRoles, ...reviewRoles]} />}
              >
                <Route
                  path="instructor/courses"
                  element={<CourseStudioPage />}
                />
              </Route>
              <Route element={<RoleRoute roles={authorRoles} />}>
                <Route
                  path="instructor/courses/:slug/media"
                  element={<LessonMediaManagerPage />}
                />
              </Route>
              <Route element={<RoleRoute roles={['ADMIN']} />}>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="accounts" element={<AccountsPage />} />
                  <Route path="courses" element={<CourseStudioPage />} />
                  <Route path="permissions" element={<PermissionsPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function HomeRoute() {
  const { user } = useAuth()
  return user ? <WorkspaceHome /> : <HomePage />
}

function DashboardRoute() {
  const { user } = useAuth()
  const target = user ? landingPage(user.roles) : '/login'
  return target === '/dashboard' ? (
    <LearningInsightsPage />
  ) : (
    <Navigate to={target} replace />
  )
}
