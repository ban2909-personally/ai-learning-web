import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { AuthProvider } from '../features/auth/AuthContext'
import { AuthPage } from '../features/auth/AuthPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
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
const CommunityHomePage = lazy(() =>
  import('../features/community/CommunityHomePage').then((module) => ({
    default: module.CommunityHomePage,
  })),
)
const SpaceDirectoryPage = lazy(() =>
  import('../features/community/SpaceDirectoryPage').then((module) => ({
    default: module.SpaceDirectoryPage,
  })),
)
const SpaceDetailPage = lazy(() =>
  import('../features/community/SpaceDetailPage').then((module) => ({
    default: module.SpaceDetailPage,
  })),
)
const CourseCatalogPage = lazy(() =>
  import('../features/catalog/CourseCatalogPage').then((module) => ({
    default: module.CourseCatalogPage,
  })),
)
const CourseDetailPage = lazy(() =>
  import('../features/catalog/CourseDetailPage').then((module) => ({
    default: module.CourseDetailPage,
  })),
)
const LearningInsightsPage = lazy(() =>
  import('../features/analytics/LearningInsightsPage').then((module) => ({
    default: module.LearningInsightsPage,
  })),
)
const MyLearningPage = lazy(() =>
  import('../features/learning/MyLearningPage').then((module) => ({
    default: module.MyLearningPage,
  })),
)
const LessonPlayerPage = lazy(() =>
  import('../features/learning/LessonPlayerPage').then((module) => ({
    default: module.LessonPlayerPage,
  })),
)
const LessonMediaManagerPage = lazy(() =>
  import('../features/learning/LessonMediaManagerPage').then((module) => ({
    default: module.LessonMediaManagerPage,
  })),
)
const AdminLayout = lazy(() =>
  import('../features/admin/AdminLayout').then((module) => ({
    default: module.AdminLayout,
  })),
)
const AdminDashboard = lazy(() =>
  import('../features/admin/AdminDashboard').then((module) => ({
    default: module.AdminDashboard,
  })),
)
const AccountsPage = lazy(() =>
  import('../features/admin/AccountsPage').then((module) => ({
    default: module.AccountsPage,
  })),
)
const PermissionsPage = lazy(() =>
  import('../features/admin/PermissionsPage').then((module) => ({
    default: module.PermissionsPage,
  })),
)
const CourseStudioPage = lazy(() =>
  import('../features/authoring/CourseStudioPage').then((module) => ({
    default: module.CourseStudioPage,
  })),
)
const FlashcardsPage = lazy(() =>
  import('../features/flashcards/FlashcardsPage').then((module) => ({
    default: module.FlashcardsPage,
  })),
)

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Suspense
            fallback={
              <main className="community-route-loading">Đang mở trang…</main>
            }
          >
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<CommunityHomePage />} />
                <Route
                  path="community/spaces"
                  element={<SpaceDirectoryPage />}
                />
                <Route
                  path="community/spaces/:id"
                  element={<SpaceDetailPage />}
                />
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
                  element={
                    <RoleRoute roles={[...authorRoles, ...reviewRoles]} />
                  }
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
          </Suspense>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
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
