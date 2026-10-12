import { useMemo, useState } from "react"
import { Download } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Capacitor } from "@capacitor/core"
import { Directory, Filesystem } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
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
          {rows.map((row) => <tr key={row.id}>{columns.map((column) => <td className={column.numeric ? "is-numeric" : ""} data-label={column.label} key={column.key}>{column.render ? column.render(row) : row[column.key] == null || row[column.key] === "" ? "—" : row[column.key]}</td>)}</tr>)}
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
  const inventoryValue = inventoryValueKnown ? sum(products.map((product) => Math.max(0, Number(product.stock || 0)) * Number(product.costPrice ?? product.cost))) : null
  const lowStockCount = products.filter((product) => Number(product.stock) < 0 || (Number(product.stock) > 0 && Number(product.stock) <= Number(product.reorderLevel ?? product.minStock ?? 1))).length
  const outOfStockCount = products.filter((product) => Number(product.stock) === 0).length
  const stockValueByUnit = businessUnits.filter((unit) => unit.id !== "all").map((unit) => {
    const value = sum(products.filter((product) => (product.businessUnitId ?? product.businessUnit) === unit.id).map((product) => Math.max(0, Number(product.stock || 0)) * Number(product.costPrice ?? product.cost)))
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

  const exportReportPdf = async () => {
    const isLandscape = activeTab !== "profit-loss"
    const pdf = new jsPDF({ orientation: isLandscape ? "landscape" : "portrait", unit: "mm", format: "a4" })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 14
    const contentWidth = pageWidth - margin * 2
    const safeText = (value) => String(value ?? "—").replace(/[·–—]/g, "-").replace(/×/g, "x")
    let y = 58

    pdf.setFillColor(31, 78, 159)
    pdf.rect(0, 0, pageWidth, 34, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(10)
    pdf.text("TOKO NONI", margin, 11)
    pdf.setFontSize(19)
    pdf.text("Laporan Bisnis", margin, 23)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.text(safeText(titleByTab[activeTab]), pageWidth - margin, 22, { align: "right" })

    pdf.setFillColor(240, 245, 252)
    pdf.roundedRect(margin, 40, contentWidth, 13, 2, 2, "F")
    pdf.setTextColor(55, 65, 81)
    pdf.setFontSize(9)
    pdf.text("Unit usaha: " + safeText(unitName), margin + 4, 45.5)
    pdf.text("Periode: " + safeText(periodLabel), margin + 4, 50)

    const addTable = (head, body, options = {}) => {
      autoTable(pdf, {
        head: [head.map(safeText)],
        body: body.map((row) => row.map(safeText)),
        startY: y,
        margin: { left: margin, right: margin, bottom: 18 },
        theme: "grid",
        styles: { font: "helvetica", fontSize: isLandscape ? 8.5 : 9, cellPadding: 3, textColor: [52, 64, 84], lineColor: [226, 232, 240], lineWidth: 0.15, overflow: "linebreak", valign: "middle" },
        headStyles: { fillColor: [31, 78, 159], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        alternateRowStyles: { fillColor: [247, 249, 252] },
        ...options,
      })
      y = pdf.lastAutoTable.finalY + 8
    }
    const addSectionTitle = (title) => {
      if (y > pageHeight - 30) { pdf.addPage(); y = 18 }
      pdf.setTextColor(31, 41, 55)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.text(safeText(title), margin, y)
      y += 4
    }

    if (activeTab === "profit-loss") {
      addSectionTitle("Ringkasan laba rugi")
      const profitRows = [
        ["Penjualan bersih", formatCurrency(revenue)],
        ["Harga Pokok Penjualan (HPP)", costOfGoods === null ? "Belum tersedia" : "(" + formatCurrency(costOfGoods) + ")"],
        ["Laba kotor", formatCurrency(grossProfit)],
        ["Biaya operasional tercatat", "(" + formatCurrency(operatingExpenses) + ")"],
        ["Pemasukan lain tercatat", formatCurrency(otherIncome)],
        ["Laba bersih", formatCurrency(netProfit)],
      ]
      addTable(["Keterangan", "Nilai"], profitRows, {
        columnStyles: { 0: { cellWidth: contentWidth * 0.66 }, 1: { halign: "right", fontStyle: "bold" } },
        didParseCell: (cell) => { if (cell.section === "body" && cell.row.index === profitRows.length - 1) { cell.cell.styles.fillColor = [231, 246, 238]; cell.cell.styles.textColor = [2, 122, 72]; cell.cell.styles.fontStyle = "bold" } },
      })
      addTable(["Indikator", "Hasil"], [["Margin laba bersih", formatPercent(netMargin)], ["Jumlah transaksi penjualan", sales.length + " transaksi"]])
      if (salesByUnit.length) {
        addSectionTitle("Kontribusi penjualan per unit")
        addTable(["Unit usaha", "Penjualan", "Kontribusi"], salesByUnit.map((unit) => [unit.label, formatCurrency(unit.amount), formatPercent(unit.percent)]), { columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } } })
      }
    } else {
      let metrics = []
      let detailHead = []
      let detailRows = []
      let rightAligned = []
      if (activeTab === "sales") {
        metrics = [["Total penjualan", formatCurrency(revenue), sales.length + " transaksi"], ["Piutang aktif", formatCurrency(sum(sales.map((sale) => Number(sale.remainingAmount || 0)))), "Sisa tagihan pelanggan"], ["Rata-rata transaksi", sales.length ? formatCurrency(revenue / sales.length) : formatCurrency(0), "Penjualan dibagi jumlah transaksi"]]
        detailHead = ["Invoice", "Tanggal", "Pelanggan", "Unit usaha", "Pembayaran", "Status", "Total"]
        detailRows = filteredSales.map((row) => [row.number || "—", row.date || "—", row.customer || "—", businessUnits.find((unit) => unit.id === row.businessUnit)?.name || "—", row.paymentMethod === "Kredit" && row.leasingProvider ? "Kredit - " + row.leasingProvider : row.paymentMethod || "—", row.status || "—", formatCurrency(row.total)])
        rightAligned = [6]
      } else if (activeTab === "purchases") {
        const pending = purchases.filter((purchase) => String(purchase.status || "").toLowerCase() === "hutang")
        metrics = [["Total pembelian", formatCurrency(purchaseTotal), purchases.length + " transaksi"], ["Hutang usaha", formatCurrency(sum(pending.map((purchase) => Number(purchase.remainingAmount ?? purchase.total)))), pending.length + " transaksi belum lunas"], ["Rata-rata pembelian", purchases.length ? formatCurrency(purchaseTotal / purchases.length) : formatCurrency(0), "Pembelian dibagi jumlah transaksi"]]
        detailHead = ["Invoice", "Tanggal", "Supplier", "Unit usaha", "Pembayaran", "Jatuh tempo", "Status", "Total"]
        detailRows = filteredPurchases.map((row) => [row.number || "—", row.date || "—", row.supplier || "—", businessUnits.find((unit) => unit.id === row.businessUnit)?.name || "—", row.paymentMethod || "—", row.dueDate || "—", row.status || "—", formatCurrency(row.total)])
        rightAligned = [7]
      } else if (activeTab === "cash-flow") {
        metrics = [["Kas masuk", formatCurrency(incoming), "Penerimaan pada periode"], ["Kas keluar", formatCurrency(outgoing), "Pengeluaran pada periode"], ["Arus kas bersih", formatCurrency(incoming - outgoing), "Masuk dikurangi keluar"]]
        detailHead = ["Tanggal", "Keterangan", "Unit usaha", "Akun", "Jenis", "Jumlah"]
        detailRows = filteredCash.map((row) => [row.date || "—", row.description || "—", businessUnits.find((unit) => unit.id === row.businessUnit)?.name || "—", row.account || "—", row.type === "income" ? "Kas masuk" : "Kas keluar", formatCurrency(row.amount)])
        rightAligned = [5]
      } else {
        metrics = [["Total SKU", products.length, "Produk terdaftar"], ["Nilai inventori", formatCurrency(inventoryValue), "Stok fisik dikali HPP; tidak termasuk pre-order"], ["Stok menipis", lowStockCount, "Termasuk pesanan pre-order yang stoknya minus"], ["Stok habis", outOfStockCount, "Produk dengan stok nol"]]
        detailHead = ["Produk", "SKU", "Unit usaha", "Stok", "HPP", "Nilai stok"]
        detailRows = filteredProducts.map((row) => [row.name || "—", row.sku || "—", businessUnits.find((unit) => unit.id === (row.businessUnitId ?? row.businessUnit))?.name || "—", Number(row.stock || 0) + " unit", formatCurrency(row.costPrice ?? row.cost), formatCurrency(Math.max(0, Number(row.stock || 0)) * Number(row.costPrice ?? row.cost ?? 0))])
        rightAligned = [3, 4, 5]
      }
      addSectionTitle("Ringkasan")
      addTable(["Indikator", "Nilai", "Keterangan"], metrics, { columnStyles: { 1: { halign: "right", fontStyle: "bold" } } })
      addSectionTitle("Rincian")
      if (detailRows.length) {
        const columnStyles = Object.fromEntries(rightAligned.map((index) => [index, { halign: "right" }]))
        addTable(detailHead, detailRows, { columnStyles })
      } else {
        addTable(["Informasi"], [["Belum ada data pada periode dan filter yang dipilih."]])
      }
    }

    const pageCount = pdf.internal.getNumberOfPages()
    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page)
      pdf.setDrawColor(220, 226, 235)
      pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(8)
      pdf.setTextColor(102, 112, 133)
      pdf.text("Toko Noni  |  Dibuat " + new Date().toLocaleDateString("id-ID"), margin, pageHeight - 7)
      pdf.text("Halaman " + page + " dari " + pageCount, pageWidth - margin, pageHeight - 7, { align: "right" })
    }

    const filename = "laporan-" + activeTab + ".pdf"
    if (!Capacitor.isNativePlatform()) { pdf.save(filename); return }
    const blob = pdf.output("blob")
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ""
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    const saved = await Filesystem.writeFile({ path: filename, data: btoa(binary), directory: Directory.Cache, recursive: true })
    await Share.share({ title: "Laporan Toko Noni", text: "Pilih simpan ke perangkat untuk menyimpan laporan PDF.", url: saved.uri, dialogTitle: "Simpan atau bagikan laporan PDF" })
  }

  return (
    <section className="reports-page">
      <header className="reports-page__header">
        <div>
          <span className="reports-page__eyebrow">ANALISIS</span>
          <h1 className="reports-page__title">Laporan Bisnis</h1>
          <p className="reports-page__description">Tinjau laporan berdasarkan periode dan unit usaha.</p>
        </div>
        <Button variant="secondary" onClick={() => { exportReportPdf().catch((error) => { console.error("Gagal membuat PDF", error); window.alert("PDF belum berhasil dibuat. Silakan coba lagi.") }) }}><Download size={16} />Unduh PDF</Button>
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
          <MetricCards items={[{ label: "Total SKU", value: products.length, detail: "Produk terdaftar" }, { label: "Nilai inventori", value: formatCurrency(inventoryValue), detail: "Stok fisik × HPP; tidak termasuk pre-order" }, { label: "Stok menipis", value: lowStockCount, detail: "Termasuk pesanan pre-order dengan stok minus" }, { label: "Stok habis", value: outOfStockCount, detail: "Produk dengan stok nol" }]} />
          <PercentagePanel title="Kontribusi nilai inventori per unit" value={inventoryValueKnown ? "" : "—"} detail={inventoryValueKnown ? "Persentase nilai stok per unit usaha." : "Persentase belum tersedia karena HPP beberapa produk belum diisi."} items={inventoryValueKnown ? stockValueByUnit.map((unit) => ({ id: unit.id, label: unit.label, percent: totalStockValue ? unit.value / totalStockValue * 100 : 0 })).filter((unit) => unit.percent > 0) : []} />
          <ReportTable rows={filteredProducts} columns={[
            { key: "name", label: "Produk" }, { key: "sku", label: "SKU" }, { key: "unit", label: "Unit usaha", render: (row) => businessUnits.find((unit) => unit.id === (row.businessUnitId ?? row.businessUnit))?.name || "—" },
            { key: "stock", label: "Stok", numeric: true, render: (row) => `${Number(row.stock || 0)} unit` },
            { key: "cost", label: "HPP", numeric: true, render: (row) => formatCurrency(row.costPrice ?? row.cost) },
            { key: "value", label: "Nilai stok", numeric: true, render: (row) => formatCurrency(Math.max(0, Number(row.stock || 0)) * Number(row.costPrice ?? row.cost ?? 0)) },
          ]} />
        </>}

        <footer className="reports-card__footer">{activeTab === "inventory" ? `${filteredProducts.length} dari ${products.length} produk` : activeTab === "sales" ? `${filteredSales.length} dari ${sales.length} transaksi` : activeTab === "purchases" ? `${filteredPurchases.length} dari ${purchases.length} transaksi` : activeTab === "cash-flow" ? `${filteredCash.length} dari ${cash.length} mutasi` : `${unitName} · ${periodLabel}`}</footer>
      </section>
    </section>
  )
}

export default ReportsPage
