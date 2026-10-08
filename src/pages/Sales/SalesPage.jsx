import { useMemo, useState } from "react"

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

function SalesPage({ data = [] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const sales = Array.isArray(data) ? data : []
  const totalSales = sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
  const unpaidSales = sales.filter((sale) =>
    ["piutang", "belum lunas", "belum dibayar"].includes(String(sale.status || "").trim().toLowerCase()),
  )
  const unpaidTotal = unpaidSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)

  const filteredSales = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return sales

    return sales.filter((sale) =>
      [
        sale.number,
        sale.customer,
        sale.paymentMethod,
        sale.status,
        sale.date,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [sales, searchTerm])

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
        </div>

        {filteredSales.length > 0 ? (
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Nomor transaksi</th>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Metode pembayaran</th>
                  <th>Status</th>
                  <th className="sales-table__amount-heading">Total</th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <strong>{sale.number || "—"}</strong>
                    </td>
                    <td>{sale.date || "—"}</td>
                    <td>{sale.customer || "—"}</td>
                    <td>{sale.paymentMethod || "—"}</td>
                    <td>
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
                    <td className="sales-table__amount">
                      {formatCurrency(sale.total)}
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


