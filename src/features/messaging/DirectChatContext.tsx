import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '../auth/AuthContext'
import type { PublicProfile } from '../community/types'

type ChatLauncher = {
  launch: { person: PublicProfile } | null
  openChat: (person: PublicProfile) => void
  clearLaunch: () => void
}
const DirectChatContext = createContext<ChatLauncher | null>(null)

export function DirectChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [launch, setLaunch] = useState<ChatLauncher['launch']>(null)
  useEffect(() => setLaunch(null), [user?.id])
  const openChat = useCallback((person: PublicProfile) => {
    setLaunch({ person })
  }, [])
  const clearLaunch = useCallback(() => setLaunch(null), [])
  return (
    <DirectChatContext.Provider value={{ launch, openChat, clearLaunch }}>
      {children}
    </DirectChatContext.Provider>
  )
}

export function useDirectChatLauncher() {
  const context = useContext(DirectChatContext)
  if (!context) throw new Error('DirectChatProvider is required')
  return context
}
