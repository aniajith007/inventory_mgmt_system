import { addTransaction, getPartSummaries, getTransactionById, getTransactionList } from '../mock/mockData'

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listTransactionsApi(params) {
  await wait()
  return getTransactionList(params)
}

export async function getTransactionApi(id) {
  await wait(120)
  const transaction = getTransactionById(id)

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  return transaction
}

export async function submitTransactionApi(payload) {
  await wait(220)

  const parts = getPartSummaries({ locationId: payload.locationId })
  const selectedPart = parts.find((item) => item.id === Number(payload.partId))

  if (!selectedPart) {
    throw new Error('Part not found for selected location')
  }

  const row = addTransaction(
    {
      ...payload,
      partNumber: selectedPart.part_number
    },
    'mock.user'
  )

  return {
    id: row.id,
    message: 'transaction submitted'
  }
}
