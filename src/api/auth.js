import { getTokenForUser, getUserByToken, locations, users, warehouses } from '../mock/mockData'

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

function toAuthUser(user) {
  const warehouse = warehouses.find((item) => item.id === user.warehouseId)
  const location = locations.find((item) => item.id === user.locationId)

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    warehouseId: user.warehouseId,
    warehouseName: warehouse?.name || null,
    locationId: user.locationId,
    locationName: location?.name || null,
    activeStatus: user.activeStatus,
    fullName: user.fullName,
    email: user.email,
    lastLoginAt: new Date().toISOString()
  }
}

export async function loginApi(payload) {
  await wait()

  const username = String(payload?.username || '').trim()
  const password = String(payload?.password || '')

  const user = users.find((item) => item.username === username)
  if (!user || user.password !== password || !user.activeStatus) {
    throw new Error('Invalid credentials or inactive user')
  }

  return {
    token: getTokenForUser(user.username),
    user: toAuthUser(user)
  }
}

export async function meApi() {
  await wait(120)

  const token = localStorage.getItem('authToken')
  const user = getUserByToken(token)

  if (!user) {
    throw new Error('Invalid or expired token')
  }

  return toAuthUser(user)
}
