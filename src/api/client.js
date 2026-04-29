let authTokenGetter = () => ''
let unauthorizedHandler = null

export function setAuthTokenGetter(getter) {
  authTokenGetter = typeof getter === 'function' ? getter : () => ''
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

function buildUrl(path, query) {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '')
  const url = new URL(`${baseUrl}${path}`)

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', query, body, headers = {} } = options
  const token = authTokenGetter?.() || ''

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler()
    }

    const message = typeof payload === 'object' && payload?.message ? payload.message : 'Request failed'
    throw new Error(message)
  }

  return payload
}
