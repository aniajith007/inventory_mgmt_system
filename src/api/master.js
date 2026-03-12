import { getBatchesByPartId, getPartSummaries, locations, warehouses } from '../mock/mockData'

const wait = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listWarehousesApi() {
  await wait()
  return warehouses
}

export async function listLocationsApi(params) {
  await wait()

  if (!params?.warehouseId) return locations
  return locations.filter((item) => item.warehouse_id === Number(params.warehouseId))
}

export async function listPartsApi(params) {
  await wait()
  return getPartSummaries(params)
}

export async function listPartBatchesApi(partId) {
  await wait()
  return getBatchesByPartId(partId)
}
