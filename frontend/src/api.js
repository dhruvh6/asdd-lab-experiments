const TOKEN_KEY = 'campuseats_token'

export const session = {
  get token() {
    return localStorage.getItem(TOKEN_KEY)
  },
  set token(value) {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  },
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// Thin fetch wrapper: adds the JWT, parses JSON and turns API errors into
// exceptions carrying the server's message.
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (session.token) headers.Authorization = `Bearer ${session.token}`

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new Event('campuseats:logout'))
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status)
  }
  return data
}
