const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

let getToken = () => localStorage.getItem('authToken')
let onUnauthorized = null

export function setAuthTokenGetter(tokenGetter) {
  getToken = tokenGetter
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

function buildUrl(path, query) {
  const safePath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${safePath}`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

export async function apiRequest(path, { method = 'GET', body, query, headers } = {}) {
  const token = getToken?.()

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined
  })

  if (response.status === 401 && onUnauthorized) {
    onUnauthorized()
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
