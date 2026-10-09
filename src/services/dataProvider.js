const STORAGE_KEY = "store-operations-app:data:v1"

const emptyStoreData = {
  products: [],
  customers: [],
  suppliers: [],
  sales: [],
  purchases: [],
  cashTransactions: [],
}

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)
}

export function readStoreData() {
  if (typeof window === "undefined") return { ...emptyStoreData }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...emptyStoreData }
    const parsed = JSON.parse(stored)

    return Object.fromEntries(
      Object.keys(emptyStoreData).map((key) => [
        key,
        Array.isArray(parsed?.[key]) ? parsed[key] : [],
      ]),
    )
  } catch {
    return { ...emptyStoreData }
  }
}

export function writeStoreData(data) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
