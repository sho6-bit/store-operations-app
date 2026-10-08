import { useMemo, useState } from "react"

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

function PurchasesPage({ data = [] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const purchases = Array.isArray(data) ? data : []
  const totalPurchases = purchases.reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0)
  const pendingPurchases = purchases.filter((purchase) =>
    ["menunggu", "pending", "belum lunas"].includes(String(purchase.status || "").trim().toLowerCase()),
  )
  const pendingTotal = pendingPurchases.reduce((sum, purchase) => sum + (Number(purchase.total) || 0), 0)

  const filteredPurchases = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return purchases

    return purchases.filter((purchase) =>
      [purchase.number, purchase.supplier, purchase.status, purchase.date]
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
      </header>

      <SummaryCards cards={[
        { label: "Total pembelian", value: purchases.length ? formatCurrency(totalPurchases) : "—", detail: "Total catatan yang tersedia", tone: "purple" },
        { label: "Transaksi pembelian", value: purchases.length, detail: "Jumlah catatan pembelian", tone: "blue" },
        { label: "Menunggu", value: pendingPurchases.length ? formatCurrency(pendingTotal) : "—", detail: pendingPurchases.length + " transaksi berstatus menunggu", tone: "orange" },
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

        {filteredPurchases.length > 0 ? (
          <div className="purchases-table-wrap">
            <table className="purchases-table">
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Tanggal</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th className="purchases-table__amount-heading">Total</th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>
                      <strong>{purchase.number || "—"}</strong>
                    </td>
                    <td>{purchase.date || "—"}</td>
                    <td>{purchase.supplier || "—"}</td>
                    <td>
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
                    <td className="purchases-table__amount">
                      {formatCurrency(purchase.total)}
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

