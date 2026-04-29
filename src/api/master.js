import { apiRequest } from './client'

export function listWarehousesApi() {
  return apiRequest('/master/warehouses')
}

export function listLocationsApi(params) {
  return apiRequest('/master/locations', { query: params })
}

export function listBookNumbersApi(params) {
  return apiRequest('/master/book-numbers', { query: params })
}

export function listPartsApi(params) {
  return apiRequest('/master/parts', { query: params })
}

export function listPartBatchesApi(partId) {
  return apiRequest(`/master/parts/${partId}/batches`)
}
