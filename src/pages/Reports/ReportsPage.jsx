import { useMemo, useState } from "react"
import { Download } from "lucide-react"
import Button from "../../components/common/Button"
import SearchInput from "../../components/common/SearchInput"
import "./reportsPage.css"

const defaultBusinessUnits = [
  { id: "all", name: "Semua Unit Usaha" },
  { id: "furniture", name: "Furniture" },
  { id: "electronic-1", name: "Electronic 1" },
  { id: "electronic-2", name: "Electronic 2" },
]

const reportTabs = [
  { id: "profit-loss", label: "Laba & Rugi" },
  { id: "sales", label: "Penjualan" },
  { id: "purchases", label: "Pembelian" },
  { id: "cash-flow", label: "Arus Kas" },
  { id: "inventory", label: "Inventori" },
]

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "—"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value) + "%"
}

function isWithinPeriod(date, startDate, endDate) {
  if (!startDate && !endDate) return true
  if (!date) return false
  const value = String(date).slice(0, 10)
  return (!startDate || value >= startDate) && (!endDate || value <= endDate)
}

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0)
}

function matchesSearch(row, query) {
  if (!query) return true
  return Object.values(row).filter((value) => ["string", "number"].includes(typeof value))
    .some((value) => String(value).toLowerCase().includes(query))
}

function MetricCards({ items }) {
  return (
    <section className="reports-metrics">
      {items.map((item) => (
        <article className="reports-metric" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.detail && <small>{item.detail}</small>}
        </article>
      ))}
    </section>
  )
}

function ReportTable({ columns, rows, emptyMessage = "Belum ada data pada periode ini." }) {
  if (!rows.length) {
    return <div className="reports-empty"><strong>{emptyMessage}</strong></div>
  }
  return (
    <div className="reports-table-wrap">
      <table className="reports-table">
        <thead><tr>{columns.map((column) => <th className={column.numeric ? "is-numeric" : ""} key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => <tr key={row.id}>{columns.map((column) => <td className={column.numeric ? "is-numeric" : ""} key={column.key}>{column.render ? column.render(row) : row[column.key] == null || row[column.key] === "" ? "—" : row[column.key]}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  )
}

function PercentagePanel({ title, value, detail, items = [] }) {
  return (
    <article className="reports-percent-panel">
      <span className="reports-percent-panel__eyebrow">{title}</span>
      <strong className="reports-percent-panel__value">{value}</strong>
      {detail && <p>{detail}</p>}
      {items.length > 0 && <div className="reports-percent-list">
        {items.map((item) => <div className="reports-percent-row" key={item.id}>
          <div><span>{item.label}</span><strong>{formatPercent(item.percent)}</strong></div>
          <div className="reports-percent-track"><i style={{ width: Math.max(0, Math.min(100, item.percent || 0)) + "%" }} /></div>
        </div>)}
      </div>}
    </article>
  )
}

function ReportsPage({ data = {}, selectedBusinessUnit = "all", onBusinessUnitChange, businessUnits = defaultBusinessUnits }) {
  const [activeTab, setActiveTab] = useState("profit-loss")
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const query = searchTerm.trim().toLowerCase()
  const allSales = Array.isArray(data.sales) ? data.sales : []
  const allPurchases = Array.isArray(data.purchases) ? data.purchases : []
  const allCash = Array.isArray(data.cashTransactions) ? data.cashTransactions : []
  const products = Array.isArray(data.products) ? data.products : []
  const sales = useMemo(() => allSales.filter((item) => isWithinPeriod(item.date, startDate, endDate)), [allSales, startDate, endDate])
  const purchases = useMemo(() => allPurchases.filter((item) => isWithinPeriod(item.date, startDate, endDate)), [allPurchases, startDate, endDate])
  const cash = useMemo(() => allCash.filter((item) => isWithinPeriod(item.date, startDate, endDate)), [allCash, startDate, endDate])
  const unitName = businessUnits.find((unit) => unit.id === selectedBusinessUnit)?.name || "Semua Unit Usaha"
  const periodLabel = startDate || endDate ? `${startDate || "Awal"} – ${endDate || "Sekarang"}` : "Semua periode"

  const revenue = sum(sales.map((sale) => sale.total))
  const hasCompleteCost = sales.every((sale) => Array.isArray(sale.items) && sale.items.every((item) => item.costPriceAtSale !== null && item.costPriceAtSale !== undefined && Number.isFinite(Number(item.costPriceAtSale))))
  const costOfGoods = hasCompleteCost
    ? sum(sales.flatMap((sale) => (sale.items || []).map((item) => Number(item.costPriceAtSale) * Number(item.quantity))))
    : null
  const operatingExpenses = sum(cash.filter((item) => item.type === "expense" && !item.sourceTransactionId && !item.sourceSettlementId && !item.transactionId && !["penjualan", "pembelian", "pelunasan penjualan"].includes(String(item.category || "").toLowerCase())).map((item) => item.amount))
  const otherIncome = sum(cash.filter((item) => item.type === "income" && !item.sourceTransactionId && !item.sourceSettlementId && !item.transactionId && !["penjualan", "pembelian", "pelunasan penjualan"].includes(String(item.category || "").toLowerCase())).map((item) => item.amount))
  const grossProfit = costOfGoods === null ? null : revenue - costOfGoods
  const netProfit = grossProfit === null ? null : grossProfit - operatingExpenses + otherIncome
  const netMargin = netProfit === null || revenue <= 0 ? null : (netProfit / revenue) * 100

  const salesByUnit = useMemo(() => {
    const totals = new Map()
    sales.forEach((sale) => totals.set(sale.businessUnit, (totals.get(sale.businessUnit) || 0) + Number(sale.total || 0)))
    const total = sum(Array.from(totals.values()))
    return businessUnits.filter((unit) => unit.id !== "all" && totals.has(unit.id)).map((unit) => ({ id: unit.id, label: unit.name, amount: totals.get(unit.id), percent: total ? (totals.get(unit.id) / total) * 100 : 0 }))
  }, [sales, businessUnits])

  const filteredSales = sales.filter((sale) => matchesSearch({ ...sale, description: sale.customer, invoice: sale.number, businessUnit: businessUnits.find((unit) => unit.id === sale.businessUnit)?.name }, query))
  const filteredPurchases = purchases.filter((purchase) => matchesSearch({ ...purchase, description: purchase.supplier, invoice: purchase.number, businessUnit: businessUnits.find((unit) => unit.id === purchase.businessUnit)?.name }, query))
  const filteredCash = cash.filter((item) => matchesSearch({ ...item, description: item.description, typeLabel: item.type === "income" ? "Kas masuk" : "Kas keluar", businessUnit: businessUnits.find((unit) => unit.id === item.businessUnit)?.name }, query))
  const filteredProducts = products.filter((product) => matchesSearch(product, query))

  const purchaseTotal = sum(purchases.map((purchase) => purchase.total))
  const unpaidPurchases = purchases.filter((purchase) => String(purchase.status || "").toLowerCase() === "hutang")
  const incoming = sum(cash.filter((item) => item.type === "income").map((item) => item.amount))
  const outgoing = sum(cash.filter((item) => item.type === "expense").map((item) => item.amount))
  const inventoryValueKnown = products.every((product) => product.costPrice != null || product.cost != null)
  const inventoryValue = inventoryValueKnown ? sum(products.map((product) => Number(product.stock || 0) * Number(product.costPrice ?? product.cost))) : null
  const lowStockCount = products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= Number(product.reorderLevel ?? product.minStock ?? 1)).length
  const outOfStockCount = products.filter((product) => Number(product.stock) === 0).length
  const stockValueByUnit = businessUnits.filter((unit) => unit.id !== "all").map((unit) => {
    const value = sum(products.filter((product) => (product.businessUnitId ?? product.businessUnit) === unit.id).map((product) => Number(product.stock || 0) * Number(product.costPrice ?? product.cost)))
    return { id: unit.id, label: unit.name, value }
  })
  const totalStockValue = sum(stockValueByUnit.map((unit) => unit.value))

  const titleByTab = {
    "profit-loss": "Laporan laba & rugi",
    sales: "Laporan penjualan",
    purchases: "Laporan pembelian",
    "cash-flow": "Laporan arus kas",
    inventory: "Laporan inventori",
  }

  return (
    <section className="reports-page">
      <header className="reports-page__header">
        <div>
          <span className="reports-page__eyebrow">ANALISIS</span>
          <h1 className="reports-page__title">Laporan Bisnis</h1>
          <p className="reports-page__description">Tinjau laporan berdasarkan periode dan unit usaha.</p>
        </div>
        <Button variant="secondary" onClick={() => window.print()}><Download size={16} />Unduh PDF</Button>
      </header>

      <section className="reports-filters" aria-label="Filter laporan">
        <label className="reports-filter"><span>Mulai</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label className="reports-filter"><span>Sampai</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        <label className="reports-filter reports-filter--unit"><span>Unit usaha</span><select value={selectedBusinessUnit} onChange={(event) => onBusinessUnitChange?.(event.target.value)}>{businessUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
      </section>

      <nav className="reports-tabs" aria-label="Jenis laporan" role="tablist">
        {reportTabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? "reports-tab reports-tab--active" : "reports-tab"} onClick={() => { setActiveTab(tab.id); setSearchTerm("") }}>{tab.label}</button>)}
      </nav>

      <section className="reports-card" aria-label={titleByTab[activeTab]}>
        <div className="reports-card__toolbar">
          <div><h2>{titleByTab[activeTab]}</h2><p>{activeTab === "inventory" ? `${unitName} · Posisi saat ini` : `${unitName} · ${periodLabel}`}</p></div>
          <SearchInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari dalam laporan..." ariaLabel="Cari laporan" />
        </div>

        {activeTab === "profit-loss" && <>
          <div className="reports-profit-layout">
            <div className="reports-statement">
              <div className="reports-statement__row"><span>Penjualan bersih</span><strong>{formatCurrency(revenue)}</strong></div>
              <div className="reports-statement__row"><span>Harga Pokok Penjualan (HPP)</span><strong>{costOfGoods === null ? "—" : `(${formatCurrency(costOfGoods)})`}</strong></div>
              <div className="reports-statement__row reports-statement__row--subtotal"><span>Laba kotor</span><strong>{formatCurrency(grossProfit)}</strong></div>
              <div className="reports-statement__row"><span>Biaya operasional tercatat</span><strong>({formatCurrency(operatingExpenses)})</strong></div>
              <div className="reports-statement__row"><span>Pemasukan lain tercatat</span><strong>{formatCurrency(otherIncome)}</strong></div>
              <div className="reports-statement__row reports-statement__row--profit"><span>Laba bersih</span><strong>{formatCurrency(netProfit)}</strong></div>
              {costOfGoods === null && <p className="reports-data-note">Persentase laba belum tersedia untuk transaksi lama yang belum memiliki catatan HPP saat penjualan.</p>}
            </div>
            <div className="reports-percent-column">
              <PercentagePanel title="Margin laba bersih" value={formatPercent(netMargin)} detail={netMargin === null ? "Menunggu data HPP yang tercatat saat transaksi." : "Laba bersih dibandingkan penjualan."} />
              <PercentagePanel title="Kontribusi penjualan per unit" value={salesByUnit.length ? "" : "—"} items={salesByUnit.map((unit) => ({ id: unit.id, label: unit.label, percent: unit.percent }))} />
            </div>
          </div>
        </>}

        {activeTab === "sales" && <>
          <MetricCards items={[{ label: "Total penjualan", value: formatCurrency(revenue), detail: `${sales.length} transaksi` }, { label: "Piutang aktif", value: formatCurrency(sum(sales.map((sale) => Number(sale.remainingAmount || 0)))), detail: "Sisa tagihan pelanggan" }, { label: "Rata-rata transaksi", value: sales.length ? formatCurrency(revenue / sales.length) : formatCurrency(0), detail: "Penjualan ÷ jumlah transaksi" }]} />
          <PercentagePanel title="Kontribusi penjualan per unit" value="" items={salesByUnit.map((unit) => ({ id: unit.id, label: unit.label, percent: unit.percent }))} />
          <ReportTable rows={filteredSales} columns={[
            { key: "number", label: "Invoice", render: (row) => row.number || "—" },
            { key: "date", label: "Tanggal" }, { key: "customer", label: "Pelanggan" },
            { key: "unit", label: "Unit usaha", render: (row) => businessUnits.find((unit) => unit.id === row.businessUnit)?.name || "—" },
            { key: "paymentMethod", label: "Pembayaran" }, { key: "status", label: "Status" },
            { key: "total", label: "Total", numeric: true, render: (row) => formatCurrency(row.total) },
          ]} />
        </>}

        {activeTab === "purchases" && <>
          <MetricCards items={[{ label: "Total pembelian", value: formatCurrency(purchaseTotal), detail: `${purchases.length} transaksi` }, { label: "Hutang usaha", value: formatCurrency(sum(unpaidPurchases.map((purchase) => Number(purchase.remainingAmount ?? purchase.total)))), detail: `${unpaidPurchases.length} transaksi belum lunas` }, { label: "Rata-rata pembelian", value: purchases.length ? formatCurrency(purchaseTotal / purchases.length) : formatCurrency(0), detail: "Pembelian ÷ jumlah transaksi" }]} />
          <PercentagePanel title="Kontribusi pembelian per unit" value="" items={businessUnits.filter((unit) => unit.id !== "all").map((unit) => { const value = sum(purchases.filter((purchase) => purchase.businessUnit === unit.id).map((purchase) => purchase.total)); return { id: unit.id, label: unit.name, percent: purchaseTotal ? value / purchaseTotal * 100 : 0 } }).filter((unit) => unit.percent > 0)} />
          <ReportTable rows={filteredPurchases} columns={[
            { key: "number", label: "Invoice", render: (row) => row.number || "—" }, { key: "date", label: "Tanggal" },
            { key: "supplier", label: "Supplier" }, { key: "unit", label: "Unit usaha", render: (row) => businessUnits.find((unit) => unit.id === row.businessUnit)?.name || "—" },
            { key: "paymentMethod", label: "Pembayaran" }, { key: "dueDate", label: "Jatuh tempo" }, { key: "status", label: "Status" },
            { key: "total", label: "Total", numeric: true, render: (row) => formatCurrency(row.total) },
          ]} />
        </>}

        {activeTab === "cash-flow" && <>
          <MetricCards items={[{ label: "Kas masuk", value: formatCurrency(incoming), detail: "Semua mutasi masuk pada periode" }, { label: "Kas keluar", value: formatCurrency(outgoing), detail: "Semua mutasi keluar pada periode" }, { label: "Arus kas bersih", value: formatCurrency(incoming - outgoing), detail: "Kas masuk dikurangi kas keluar" }]} />
          <PercentagePanel title="Komposisi arus kas" value={incoming + outgoing ? formatPercent(incoming / (incoming + outgoing) * 100) + " masuk" : "—"} detail={incoming + outgoing ? formatPercent(outgoing / (incoming + outgoing) * 100) + " keluar" : "Belum ada mutasi kas."} />
          <ReportTable rows={filteredCash} columns={[
            { key: "date", label: "Tanggal" }, { key: "description", label: "Keterangan" },
            { key: "unit", label: "Unit usaha", render: (row) => businessUnits.find((unit) => unit.id === row.businessUnit)?.name || "—" },
            { key: "account", label: "Akun" }, { key: "type", label: "Jenis", render: (row) => row.type === "income" ? "Kas masuk" : "Kas keluar" },
            { key: "amount", label: "Jumlah", numeric: true, render: (row) => formatCurrency(row.amount) },
          ]} />
        </>}

        {activeTab === "inventory" && <>
          <MetricCards items={[{ label: "Total SKU", value: products.length, detail: "Produk terdaftar" }, { label: "Nilai inventori", value: formatCurrency(inventoryValue), detail: "Stok × HPP produk" }, { label: "Stok menipis", value: lowStockCount, detail: "Stok di atas nol sampai batas minimum" }, { label: "Stok habis", value: outOfStockCount, detail: "Produk dengan stok nol" }]} />
          <PercentagePanel title="Kontribusi nilai inventori per unit" value={inventoryValueKnown ? "" : "—"} detail={inventoryValueKnown ? "Persentase nilai stok per unit usaha." : "Persentase belum tersedia karena HPP beberapa produk belum diisi."} items={inventoryValueKnown ? stockValueByUnit.map((unit) => ({ id: unit.id, label: unit.label, percent: totalStockValue ? unit.value / totalStockValue * 100 : 0 })).filter((unit) => unit.percent > 0) : []} />
          <ReportTable rows={filteredProducts} columns={[
            { key: "name", label: "Produk" }, { key: "sku", label: "SKU" }, { key: "unit", label: "Unit usaha", render: (row) => businessUnits.find((unit) => unit.id === (row.businessUnitId ?? row.businessUnit))?.name || "—" },
            { key: "stock", label: "Stok", numeric: true, render: (row) => `${Number(row.stock || 0)} unit` },
            { key: "cost", label: "HPP", numeric: true, render: (row) => formatCurrency(row.costPrice ?? row.cost) },
            { key: "value", label: "Nilai stok", numeric: true, render: (row) => formatCurrency(Number(row.stock || 0) * Number(row.costPrice ?? row.cost ?? 0)) },
          ]} />
        </>}

        <footer className="reports-card__footer">{activeTab === "inventory" ? `${filteredProducts.length} dari ${products.length} produk` : activeTab === "sales" ? `${filteredSales.length} dari ${sales.length} transaksi` : activeTab === "purchases" ? `${filteredPurchases.length} dari ${purchases.length} transaksi` : activeTab === "cash-flow" ? `${filteredCash.length} dari ${cash.length} mutasi` : `${unitName} · ${periodLabel}`}</footer>
      </section>
    </section>
  )
}

export default ReportsPage
