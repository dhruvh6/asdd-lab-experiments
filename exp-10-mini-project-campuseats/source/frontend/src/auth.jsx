import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, session } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(session.token))

  const logout = useCallback(() => {
    session.token = null
    setUser(null)
  }, [])

  useEffect(() => {
    if (session.token) {
      api('/auth/me')
        .then((data) => setUser(data.user))
        .catch(() => logout())
        .finally(() => setLoading(false))
    }
    window.addEventListener('campuseats:logout', logout)
    return () => window.removeEventListener('campuseats:logout', logout)
  }, [logout])

  async function signIn(path, body) {
    const data = await api(path, { method: 'POST', body })
    session.token = data.token
    setUser(data.user)
    return data.user
  }

  const value = {
    user,
    loading,
    logout,
    login: (email, password) => signIn('/auth/login', { email, password }),
    register: (name, email, password) => signIn('/auth/register', { name, email, password }),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

// oxlint-disable-next-line react/only-export-components
export function homeFor(user) {
  if (!user) return '/login'
  if (user.role === 'admin') return '/admin'
  if (user.role === 'staff') return '/kitchen'
  return '/'
}
