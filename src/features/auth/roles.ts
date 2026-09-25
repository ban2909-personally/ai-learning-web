export const roleLabels: Record<string, string> = {
  GUEST: 'Khách',
  STUDENT: 'Học viên',
  LECTURE: 'Giảng viên',
  INSTRUCTOR: 'Giảng viên',
  LEADER: 'Trưởng bộ môn',
  ADMIN: 'Quản trị viên',
}
export const workspaceRoles = [
  'STUDENT',
  'LECTURE',
  'INSTRUCTOR',
  'LEADER',
  'ADMIN',
]
export const authorRoles = ['LECTURE', 'INSTRUCTOR', 'ADMIN']
export const reviewRoles = ['LEADER', 'ADMIN']
export function hasRole(roles: string[] | undefined, allowed: string[]) {
  return roles?.some((role) => allowed.includes(role)) ?? false
}
export function landingPage(roles: string[]) {
  if (roles.includes('ADMIN')) return '/admin'
  if (hasRole(roles, [...authorRoles, ...reviewRoles]))
    return '/instructor/courses'
  return roles.includes('STUDENT') ? '/dashboard' : '/courses'
}
