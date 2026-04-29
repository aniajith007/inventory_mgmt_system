import { apiRequest } from './client'

export function listTransactionsApi(params) {
  return apiRequest('/transactions', { query: params })
}

export function getTransactionApi(id) {
  return apiRequest(`/transactions/${id}`)
}

export function submitTransactionApi(payload) {
  return apiRequest('/transactions/submit', {
    method: 'POST',
    body: payload
  })
}

export function updateTransactionByBuHeadApi(id, payload) {
  return apiRequest(`/transactions/${id}/bu-update`, {
    method: 'PATCH',
    body: payload
  })
}

export function updateTransactionByAuditorApi(id, payload) {
  return apiRequest(`/transactions/${id}/auditor-remark`, {
    method: 'PATCH',
    body: payload
  })
}
