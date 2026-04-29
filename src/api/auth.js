import { apiRequest } from './client'

export function loginApi(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: payload
  })
}

export function meApi() {
  return apiRequest('/auth/me')
}
