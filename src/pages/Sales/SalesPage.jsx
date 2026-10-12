import { useEffect, useMemo, useState } from "react"

import { CircleDollarSign, Pencil, Plus, Trash2 } from "lucide-react"
import Button from "../../components/common/Button"
import SearchInput from "../../components/common/SearchInput"
import SummaryCards from "../../components/common/SummaryCards"
import "./salesPage.css"

function formatCurrency(value) {
  if (value === null || value === undefined) return "—"

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

const defaultBusinessUnits = [{ id: "furniture", name: "Furniture" }, { id: "electronic-1", name: "Electronic 1" }, { id: "electronic-2", name: "Electronic 2" }]

function SalesPage({ data = [], onCreateTransaction, onEditTransaction, onSettleTransaction, onDeleteTransaction, businessUnits = defaultBusinessUnits, globalSearchValue = "" }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortMode, setSortMode] = useState("date-desc")
  const [monthFilter, setMonthFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [actionError, setActionError] = useState("")
  useEffect(() => { setSearchTerm(globalSearchValue) }, [globalSearchValue])
  const sales = Array.isArray(data) ? data : []
  const totalSales = sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
  const unpaidSales = sales.filter((sale) =>
    ["piutang", "belum lunas", "belum dibayar"].includes(String(sale.status || "").trim().toLowerCase()),
  )
  const unpaidTotal = unpaidSales.reduce((sum, sale) => sum + (Number(sale.remainingAmount ?? sale.total) || 0), 0)

  async function handleDelete(sale) {
    setActionError("")
    if (!window.confirm("Hapus transaksi penjualan " + (sale.number || "") + "? Stok barang akan dipulihkan dan mutasi kas serta pelunasan yang terkait akan dihapus.")) return
    try {
      if (typeof onDeleteTransaction !== "function") throw new Error("Aksi hapus belum tersambung.")
      await onDeleteTransaction(sale.id)
    } catch (error) { setActionError(error?.message || "Transaksi penjualan gagal dihapus.") }
  }

  const availableYears = [...new Set(sales.map((record) => String(record.date || "").slice(0, 4)).filter((value) => /^\d{4}$/.test(value)))].sort((a, b) => b.localeCompare(a))
  const availableMonths = [...new Set(sales.map((record) => String(record.date || "").slice(0, 7)).filter((value) => /^\d{4}-\d{2}$/.test(value)))].sort((a, b) => b.localeCompare(a))
  const filteredSales = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("id-ID")
    return sales.filter((record) => {
      const matchesSearch = !query || [record.customer, record.number, record.invoiceNumber, record.businessUnit, record.status, record.paymentMethod, record.date]
        .filter(Boolean).some((value) => String(value).toLocaleLowerCase("id-ID").includes(query))
      const date = String(record.date || "")
      return matchesSearch && (monthFilter === "all" || date.slice(0, 7) === monthFilter) && (yearFilter === "all" || date.slice(0, 4) === yearFilter)
    }).sort((a, b) => {
      const aDate = String(a.date || "")
      const bDate = String(b.date || "")
      const aName = String(a.customer || a.number || "")
      const bName = String(b.customer || b.number || "")
      if (sortMode === "name-asc") return aName.localeCompare(bName, "id", { sensitivity: "base" })
      if (sortMode === "name-desc") return bName.localeCompare(aName, "id", { sensitivity: "base" })
      if (sortMode === "date-asc") return aDate.localeCompare(bDate)
      if (sortMode === "month-desc") return bDate.slice(0, 7).localeCompare(aDate.slice(0, 7)) || bDate.localeCompare(aDate)
      if (sortMode === "year-desc") return bDate.slice(0, 4).localeCompare(aDate.slice(0, 4)) || bDate.localeCompare(aDate)
      return bDate.localeCompare(aDate)
    })
  }, [sales, searchTerm, sortMode, monthFilter, yearFilter])

  return (
    <section className="sales-page">
      <header className="sales-page__header">
        <div>
          <span className="sales-page__eyebrow">Transaksi</span>
          <h1 className="sales-page__title">Penjualan</h1>
          <p className="sales-page__description">
            Lihat catatan transaksi penjualan yang tersedia.
          </p>
        </div>
        <Button onClick={onCreateTransaction}><Plus size={16} />Buat Transaksi</Button>
      </header>

      <SummaryCards cards={[
        { label: "Penjualan", value: sales.length ? formatCurrency(totalSales) : "—", detail: "Total transaksi yang tersedia", tone: "blue" },
        { label: "Transaksi", value: sales.length, detail: "Jumlah catatan penjualan", tone: "purple" },
        { label: "Piutang aktif", value: unpaidSales.length ? formatCurrency(unpaidTotal) : "—", detail: unpaidSales.length + " transaksi belum lunas", tone: "orange" },
      ]} />

      <section className="sales-card" aria-label="Daftar penjualan">
        <div className="sales-card__toolbar">
          <div>
            <h2>Riwayat penjualan</h2>
            <p>{sales.length} transaksi</p>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nomor, pelanggan, atau status..."
            ariaLabel="Cari transaksi penjualan"
          />
          <div className="history-sort-controls">
            <label><span className="sr-only">Urutkan riwayat</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value)}><option value="date-desc">Tanggal terbaru</option><option value="date-asc">Tanggal terlama</option><option value="name-asc">Nama A–Z</option><option value="name-desc">Nama Z–A</option><option value="month-desc">Bulan terbaru</option><option value="year-desc">Tahun terbaru</option></select></label>
            <label><span className="sr-only">Filter bulan</span><select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}><option value="all">Semua bulan</option>{availableMonths.map((month) => <option key={month} value={month}>{new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(month + "-01T00:00:00"))}</option>)}</select></label>
            <label><span className="sr-only">Filter tahun</span><select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}><option value="all">Semua tahun</option>{availableYears.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          </div>
        </div>

        {actionError && <p className="transaction-action-error" role="alert">{actionError}</p>}

        {filteredSales.length > 0 ? (
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Nomor transaksi</th>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Unit usaha</th>
                  <th>Metode pembayaran</th>
                  <th>Status</th>
                  <th className="sales-table__amount-heading">Total</th>
                  <th className="sales-table__action-heading">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td data-label="Nomor transaksi">
                      <strong>{sale.number || "—"}</strong>
                    </td>
                    <td data-label="Tanggal">{sale.date || "—"}</td>
                    <td data-label="Pelanggan">{sale.customer || "—"}</td>
                    <td data-label="Unit usaha">{businessUnits.find((unit) => unit.id === sale.businessUnit)?.name || sale.businessUnit || "—"}</td>
                    <td data-label="Metode pembayaran">{sale.paymentMethod === "Kredit" && sale.leasingProvider
                      ? "Kredit · " + sale.leasingProvider
                      : sale.paymentMethod === "DP" && sale.paymentChannel
                        ? "DP · " + sale.paymentChannel
                        : sale.paymentMethod || "—"}</td>
                    <td data-label="Status">
                      {sale.status ? (
                        <span
                          className={`sales-status sales-status--${String(
                            sale.status,
                          )
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {sale.status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="sales-table__amount" data-label="Total">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="sales-table__action" data-label="Aksi">
                      {Number(sale.remainingAmount ?? 0) > 0 && <button className="sales-edit-button sales-edit-button--settle" type="button" onClick={() => onSettleTransaction?.(sale)} aria-label={"Catat pelunasan " + (sale.number || "")} title="Catat pelunasan"><CircleDollarSign size={16} /></button>}
                      <button className="sales-edit-button" type="button" onClick={() => onEditTransaction?.(sale)} aria-label={"Edit transaksi " + (sale.number || "") } title="Edit transaksi">
                        <Pencil size={16} />
                      </button>
                      <button className="transaction-delete-button" type="button" onClick={() => handleDelete(sale)} aria-label={"Hapus transaksi " + (sale.number || "")} title="Hapus transaksi"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sales-empty">
            <strong>
              {searchTerm
                ? "Transaksi tidak ditemukan"
                : "Belum ada data penjualan"}
            </strong>
            <span>
              {searchTerm
                ? "Periksa kata kunci pencarian."
                : "Catatan penjualan akan tampil di sini setelah datanya tersedia."}
            </span>
          </div>
        )}

        <footer className="sales-card__footer">
          Menampilkan {filteredSales.length} dari {sales.length} transaksi
        </footer>
      </section>
    </section>
  )
}

export default SalesPage


