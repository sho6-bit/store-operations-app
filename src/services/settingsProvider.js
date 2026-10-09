const SETTINGS_KEY = "store-operations-app:settings:v1"

export const defaultAppSettings = {
  storeProfile: {
    name: "Toko Noni",
    description: "Store Operations",
    contact: "",
    address: "",
  },
  businessUnits: [
    { id: "furniture", name: "Furniture" },
    { id: "electronic-1", name: "Electronic 1" },
    { id: "electronic-2", name: "Electronic 2" },
  ],
  accounts: {
    furniture: { cash: "Kas Furniture", bank: "Bank Furniture" },
    "electronic-1": { cash: "Kas Electronic 1", bank: "Bank Electronic 1" },
    "electronic-2": { cash: "Kas Electronic 2", bank: "Bank Electronic 2" },
  },
  stockLowThreshold: 1,
}

export function readAppSettings() {
  if (typeof window === "undefined") return defaultAppSettings
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "null")
    if (!saved || typeof saved !== "object") return defaultAppSettings
    return {
      ...defaultAppSettings,
      ...saved,
      storeProfile: { ...defaultAppSettings.storeProfile, ...saved.storeProfile, name: "Toko Noni" },
      businessUnits: defaultAppSettings.businessUnits.map((unit) => ({
        ...unit,
        ...(saved.businessUnits || []).find((savedUnit) => savedUnit.id === unit.id),
      })),
      accounts: Object.fromEntries(defaultAppSettings.businessUnits.map((unit) => [
        unit.id,
        { ...defaultAppSettings.accounts[unit.id], ...(saved.accounts?.[unit.id] || {}) },
      ])),
      stockLowThreshold: Math.max(0, Number(saved.stockLowThreshold ?? 1)),
    }
  } catch {
    return defaultAppSettings
  }
}

export function writeAppSettings(settings) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
