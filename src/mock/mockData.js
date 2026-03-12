const users = [
  {
    id: 1,
    username: 'superadmin',
    password: '1234',
    role: 'super_admin',
    warehouseId: null,
    locationId: null,
    fullName: 'Super Admin',
    email: 'superadmin@mock.local',
    activeStatus: true
  },
  {
    id: 2,
    username: 'admin1',
    password: '1234',
    role: 'admin',
    warehouseId: 1,
    locationId: null,
    fullName: 'Warehouse Admin',
    email: 'admin1@mock.local',
    activeStatus: true
  },
  {
    id: 3,
    username: 'user1',
    password: '1234',
    role: 'user',
    warehouseId: 1,
    locationId: 1,
    fullName: 'Audit User',
    email: 'user1@mock.local',
    activeStatus: true
  }
]

const warehouses = [
  { id: 1, code: 'WH-001', name: 'Main Warehouse', active_status: true },
  { id: 2, code: 'WH-002', name: 'Spare Warehouse', active_status: true }
]

const locations = [
  { id: 1, warehouse_id: 1, code: 'C12', name: 'Rack C12', active_status: true, warehouse_name: 'Main Warehouse' },
  { id: 2, warehouse_id: 1, code: 'C13', name: 'Rack C13', active_status: true, warehouse_name: 'Main Warehouse' },
  { id: 3, warehouse_id: 1, code: 'C14', name: 'Rack C14', active_status: true, warehouse_name: 'Main Warehouse' }
]

const partMasterRows = [
  { id: 101, warehouse_id: 1, location_id: 1, part_number: 'PN-C12-001', batch_no: 'BATCH-C12-001-A', system_quantity: 40, active_status: true },
  { id: 102, warehouse_id: 1, location_id: 1, part_number: 'PN-C12-001', batch_no: 'BATCH-C12-001-B', system_quantity: 25, active_status: true },
  { id: 103, warehouse_id: 1, location_id: 1, part_number: 'PN-C12-001', batch_no: 'BATCH-C12-001-C', system_quantity: 10, active_status: true },
  { id: 201, warehouse_id: 1, location_id: 2, part_number: 'PN-C13-003', batch_no: 'BATCH-C13-003-A', system_quantity: 60, active_status: true },
  { id: 202, warehouse_id: 1, location_id: 2, part_number: 'PN-C13-003', batch_no: 'BATCH-C13-003-B', system_quantity: 15, active_status: true },
  { id: 301, warehouse_id: 1, location_id: 3, part_number: 'PN-C14-009', batch_no: 'BATCH-C14-009-A', system_quantity: 22, active_status: true }
]

let transactionCounter = 1
const transactions = []

function getTokenForUser(username) {
  return `mock-token-${username}`
}

function getUserByToken(token) {
  if (!token?.startsWith('mock-token-')) return null
  const username = token.replace('mock-token-', '')
  return users.find((item) => item.username === username) || null
}

function toPartSummary(row) {
  const location = locations.find((item) => item.id === row.location_id)
  const warehouse = warehouses.find((item) => item.id === row.warehouse_id)

  return {
    id: row.id,
    location_id: row.location_id,
    part_number: row.part_number,
    part_name: row.part_number,
    uom: 'NOS',
    active_status: true,
    location_name: location?.name || '',
    warehouse_name: warehouse?.name || '',
    total_system_quantity: partMasterRows
      .filter((item) => item.location_id === row.location_id && item.part_number === row.part_number)
      .reduce((sum, item) => sum + Number(item.system_quantity), 0)
  }
}

function getPartSummaries({ warehouseId, locationId } = {}) {
  const filtered = partMasterRows.filter((row) => {
    if (warehouseId && row.warehouse_id !== Number(warehouseId)) return false
    if (locationId && row.location_id !== Number(locationId)) return false
    return true
  })

  const seen = new Set()
  const result = []

  filtered.forEach((row) => {
    const key = `${row.location_id}:${row.part_number}`
    if (seen.has(key)) return
    seen.add(key)
    result.push(toPartSummary(row))
  })

  return result.sort((a, b) => a.part_number.localeCompare(b.part_number))
}

function getBatchesByPartId(partId) {
  const part = partMasterRows.find((item) => item.id === Number(partId))
  if (!part) return []

  return partMasterRows
    .filter((item) => item.location_id === part.location_id && item.part_number === part.part_number)
    .map((item) => ({
      id: item.id,
      batch_no: item.batch_no,
      system_quantity: item.system_quantity,
      active_status: item.active_status
    }))
}

function addTransaction(payload, submittedByUsername) {
  const submittedAt = new Date().toISOString()
  const id = transactionCounter++

  const row = {
    id,
    warehouse_id: Number(payload.warehouseId),
    location_id: Number(payload.locationId),
    part_number: payload.partNumber,
    counted_quantity: Number(payload.countedQuantity),
    remarks: payload.remarks || null,
    reference_no: payload.referenceNo || null,
    submitted_by_username: submittedByUsername,
    submitted_at: submittedAt,
    batches: (payload.batches || []).map((batch, index) => ({
      id: Number(`${id}${index + 1}`),
      batch_no: batch.batchNo || '-',
      system_quantity: Number(batch.systemQuantity || 0),
      counted_quantity: Number(batch.countedQuantity || 0),
      variance_quantity: Number(batch.varianceQuantity || 0)
    }))
  }

  transactions.unshift(row)
  return row
}

function getTransactionList({ locationId } = {}) {
  const filtered = transactions.filter((item) => {
    if (!locationId) return true
    return item.location_id === Number(locationId)
  })

  return filtered.map((item) => {
    const warehouse = warehouses.find((row) => row.id === item.warehouse_id)
    const location = locations.find((row) => row.id === item.location_id)

    return {
      id: item.id,
      warehouse_id: item.warehouse_id,
      location_id: item.location_id,
      counted_quantity: item.counted_quantity,
      remarks: item.remarks,
      reference_no: item.reference_no,
      submitted_at: item.submitted_at,
      warehouse_name: warehouse?.name || '',
      location_name: location?.name || '',
      part_number: item.part_number,
      part_name: item.part_number,
      submitted_by_username: item.submitted_by_username
    }
  })
}

function getTransactionById(id) {
  const item = transactions.find((row) => row.id === Number(id))
  if (!item) return null

  const warehouse = warehouses.find((row) => row.id === item.warehouse_id)
  const location = locations.find((row) => row.id === item.location_id)

  return {
    id: item.id,
    warehouse_id: item.warehouse_id,
    location_id: item.location_id,
    counted_quantity: item.counted_quantity,
    remarks: item.remarks,
    reference_no: item.reference_no,
    submitted_at: item.submitted_at,
    warehouse_name: warehouse?.name || '',
    location_name: location?.name || '',
    part_number: item.part_number,
    part_name: item.part_number,
    submitted_by_username: item.submitted_by_username,
    batches: item.batches
  }
}

export {
  users,
  warehouses,
  locations,
  getTokenForUser,
  getUserByToken,
  getPartSummaries,
  getBatchesByPartId,
  addTransaction,
  getTransactionList,
  getTransactionById
}
