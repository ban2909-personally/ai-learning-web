import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

describe('AuthProvider', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shares one refresh request between concurrent token consumers', async () => {
    const expired = jwt(Math.floor(Date.now() / 1000) - 60)
    const fresh = jwt(Math.floor(Date.now() / 1000) + 600)
    const sessions = [session(expired), session(fresh)]
    const fetchMock = vi.fn().mockImplementation(async () => new Response(
      JSON.stringify(sessions.shift()),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><TokenProbe /></AuthProvider>)
    await screen.findByText('ready')
    fireEvent.click(screen.getByRole('button', { name: 'Lấy token' }))

    await screen.findByText(fresh)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })
})

function TokenProbe() {
  const { isLoading, getAccessToken } = useAuth()
  const [token, setToken] = useState('')
  const requestTwice = async () => {
    const tokens = await Promise.all([getAccessToken(), getAccessToken()])
    setToken(tokens[0])
  }
  return (
    <div>
      <span>{isLoading ? 'loading' : 'ready'}</span>
      <span>{token}</span>
      <button type="button" onClick={() => void requestTwice()}>Lấy token</button>
    </div>
  )
}

function session(accessToken: string) {
  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: 900,
    user: {
      id: 'f9739374-28f7-41ed-9538-99004f124fc4',
      email: 'student@example.com',
      displayName: 'Student',
      roles: ['STUDENT'],
    },
  }
}

function jwt(exp: number) {
  return `header.${btoa(JSON.stringify({ exp })).replaceAll('=', '')}.signature`
}
