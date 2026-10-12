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

  const filteredPurchases = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return purchases

    return purchases.filter((purchase) =>
      [purchase.number, purchase.supplier, purchase.businessUnit, purchase.status, purchase.paymentMethod, purchase.date, purchase.dueDate]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [purchases, searchTerm])

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

