export type User = {
  id: string
  email: string
  displayName: string
  roles: string[]
}

export type AuthResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: User
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = LoginInput & {
  displayName: string
}
