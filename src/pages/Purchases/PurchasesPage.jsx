import { useEffect, useMemo, useState } from "react"

import { Pencil, Plus, Trash2 } from "lucide-react"
import Button from "../../components/common/Button"
import SearchInput from "../../components/common/SearchInput"
import SummaryCards from "../../components/common/SummaryCards"
import "./purchasesPage.css"

function formatCurrency(value) {
  if (value === null || value === undefined) return "—"

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

const defaultBusinessUnits = [{ id: "furniture", name: "Furniture" }, { id: "electronic-1", name: "Electronic 1" }, { id: "electronic-2", name: "Electronic 2" }]

function PurchasesPage({ data = [], onCreateTransaction, onEditTransaction, onDeleteTransaction, businessUnits = defaultBusinessUnits, globalSearchValue = "" }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortMode, setSortMode] = useState("date-desc")
  const [monthFilter, setMonthFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [actionError, setActionError] = useState("")
  useEffect(() => { setSearchTerm(globalSearchValue) }, [globalSearchValue])
  const purchases = Array.isArray(data) ? data : []
  const totalPurchases = purchases.reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0)
  const pendingPurchases = purchases.filter((purchase) =>
    ["menunggu", "pending", "belum lunas", "belum dibayar", "hutang"].includes(String(purchase.status || "").trim().toLowerCase()),
  )
  const pendingTotal = pendingPurchases.reduce((sum, purchase) => sum + (Number(purchase.remainingAmount ?? purchase.total) || 0), 0)

  async function handleDelete(purchase) {
    setActionError("")
    if (!window.confirm("Hapus transaksi pembelian " + (purchase.number || "") + "? Stok dan mutasi kas yang terkait akan disesuaikan.")) return
    try {
      if (typeof onDeleteTransaction !== "function") throw new Error("Aksi hapus belum tersambung.")
      await onDeleteTransaction(purchase.id)
    } catch (error) { setActionError(error?.message || "Transaksi pembelian gagal dihapus.") }
  }

  const availableYears = [...new Set(purchases.map((record) => String(record.date || "").slice(0, 4)).filter((value) => /^\d{4}$/.test(value)))].sort((a, b) => b.localeCompare(a))
  const availableMonths = [...new Set(purchases.map((record) => String(record.date || "").slice(0, 7)).filter((value) => /^\d{4}-\d{2}$/.test(value)))].sort((a, b) => b.localeCompare(a))
  const filteredPurchases = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("id-ID")
    return purchases.filter((record) => {
      const matchesSearch = !query || [record.supplier, record.number, record.invoiceNumber, record.businessUnit, record.status, record.paymentMethod, record.date]
        .filter(Boolean).some((value) => String(value).toLocaleLowerCase("id-ID").includes(query))
      const date = String(record.date || "")
      return matchesSearch && (monthFilter === "all" || date.slice(0, 7) === monthFilter) && (yearFilter === "all" || date.slice(0, 4) === yearFilter)
    }).sort((a, b) => {
      const aDate = String(a.date || "")
      const bDate = String(b.date || "")
      const aName = String(a.supplier || a.number || "")
      const bName = String(b.supplier || b.number || "")
      if (sortMode === "name-asc") return aName.localeCompare(bName, "id", { sensitivity: "base" })
      if (sortMode === "name-desc") return bName.localeCompare(aName, "id", { sensitivity: "base" })
      if (sortMode === "date-asc") return aDate.localeCompare(bDate)
      if (sortMode === "month-desc") return bDate.slice(0, 7).localeCompare(aDate.slice(0, 7)) || bDate.localeCompare(aDate)
      if (sortMode === "year-desc") return bDate.slice(0, 4).localeCompare(aDate.slice(0, 4)) || bDate.localeCompare(aDate)
      return bDate.localeCompare(aDate)
    })
  }, [purchases, searchTerm, sortMode, monthFilter, yearFilter])

  return (
    <section className="purchases-page">
      <header className="purchases-page__header">
        <div>
          <span className="purchases-page__eyebrow">Pembelian</span>
          <h1 className="purchases-page__title">Daftar Pembelian</h1>
          <p className="purchases-page__description">
            Lihat catatan pembelian yang tersedia.
          </p>
        </div>
        <Button onClick={onCreateTransaction}><Plus size={16} />Buat Transaksi</Button>
      </header>

      <SummaryCards cards={[
        { label: "Total pembelian", value: purchases.length ? formatCurrency(totalPurchases) : "—", detail: "Total catatan yang tersedia", tone: "purple" },
        { label: "Transaksi pembelian", value: purchases.length, detail: "Jumlah catatan pembelian", tone: "blue" },
        { label: "Hutang aktif", value: pendingPurchases.length ? formatCurrency(pendingTotal) : "—", detail: pendingPurchases.length + " transaksi belum dibayar", tone: "orange" },
      ]} />

      <section className="purchases-card" aria-label="Daftar pembelian">
        <div className="purchases-card__toolbar">
          <div>
            <h2>Riwayat pembelian</h2>
            <p>{purchases.length} pembelian</p>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nomor, supplier, atau status..."
            ariaLabel="Cari pembelian"
          />
          <div className="history-sort-controls">
            <label><span className="sr-only">Urutkan riwayat</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value)}><option value="date-desc">Tanggal terbaru</option><option value="date-asc">Tanggal terlama</option><option value="name-asc">Nama A–Z</option><option value="name-desc">Nama Z–A</option><option value="month-desc">Bulan terbaru</option><option value="year-desc">Tahun terbaru</option></select></label>
            <label><span className="sr-only">Filter bulan</span><select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}><option value="all">Semua bulan</option>{availableMonths.map((month) => <option key={month} value={month}>{new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(month + "-01T00:00:00"))}</option>)}</select></label>
            <label><span className="sr-only">Filter tahun</span><select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}><option value="all">Semua tahun</option>{availableYears.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          </div>
        </div>

        {actionError && <p className="transaction-action-error" role="alert">{actionError}</p>}

        {filteredPurchases.length > 0 ? (
          <div className="purchases-table-wrap">
            <table className="purchases-table">
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Tanggal</th>
                  <th>Supplier</th>
                  <th>Unit usaha</th>
                  <th>Metode pembayaran</th>
                  <th>Jatuh tempo</th>
                  <th>Status</th>
                  <th className="purchases-table__amount-heading">Total</th>
                  <th className="purchases-table__action-heading">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td data-label="Nomor">
                      <strong>{purchase.number || "—"}</strong>
                    </td>
                    <td data-label="Tanggal">{purchase.date || "—"}</td>
                    <td data-label="Supplier">{purchase.supplier || "—"}</td>
                    <td data-label="Unit usaha">{businessUnits.find((unit) => unit.id === purchase.businessUnit)?.name || purchase.businessUnit || "—"}</td>
                    <td data-label="Metode pembayaran">{purchase.paymentMethod || "—"}</td>
                    <td data-label="Jatuh tempo">{purchase.dueDate || "—"}</td>
                    <td data-label="Status">
                      {purchase.status ? (
                        <span
                          className={`purchases-status purchases-status--${String(
                            purchase.status,
                          )
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {purchase.status}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="purchases-table__amount" data-label="Total">
                      {formatCurrency(purchase.total)}
                    </td>
                    <td className="purchases-table__action" data-label="Aksi">
                      <button className="purchases-edit-button" type="button" onClick={() => onEditTransaction?.(purchase)} aria-label={"Edit transaksi " + (purchase.number || "") } title="Edit transaksi">
                        <Pencil size={16} />
                      </button>
                      <button className="transaction-delete-button" type="button" onClick={() => handleDelete(purchase)} aria-label={"Hapus transaksi " + (purchase.number || "")} title="Hapus transaksi"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="purchases-empty">
            <strong>
              {searchTerm
                ? "Pembelian tidak ditemukan"
                : "Belum ada data pembelian"}
            </strong>
            <span>
              {searchTerm
                ? "Periksa kata kunci pencarian."
                : "Catatan pembelian akan tampil di sini setelah datanya tersedia."}
            </span>
          </div>
        )}

        <footer className="purchases-card__footer">
          Menampilkan {filteredPurchases.length} dari {purchases.length} pembelian
        </footer>
      </section>
    </section>
  )
}

export default PurchasesPage

