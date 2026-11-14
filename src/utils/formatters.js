const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

export function formatCurrency(value, { emptyStringAsDash = false } = {}) {
  if (value === null || value === undefined || (emptyStringAsDash && value === "")) {
    return "—"
  }

  return rupiahFormatter.format(value)
}

export function formatCurrencyOrDash(value) {
  return formatCurrency(value, { emptyStringAsDash: true })
}
