import { describe, expect, it } from 'vitest'
import { hasRole, landingPage, authorRoles, reviewRoles } from './roles'

describe('workspace role routing', () => {
  it.each([
    ['ADMIN', '/admin'],
    ['LECTURE', '/instructor/courses'],
    ['INSTRUCTOR', '/instructor/courses'],
    ['LEADER', '/instructor/courses'],
    ['STUDENT', '/dashboard'],
    ['GUEST', '/courses'],
  ])('routes %s to its own workspace', (role, path) => {
    expect(landingPage([role])).toBe(path)
  })

  it('does not grant authoring or review to guests and students', () => {
    expect(hasRole(['GUEST', 'STUDENT'], authorRoles)).toBe(false)
    expect(hasRole(['GUEST', 'STUDENT'], reviewRoles)).toBe(false)
    expect(hasRole(['LECTURE'], reviewRoles)).toBe(false)
    expect(hasRole(undefined, authorRoles)).toBe(false)
    expect(landingPage(['STUDENT', 'ADMIN'])).toBe('/admin')
  })
})
