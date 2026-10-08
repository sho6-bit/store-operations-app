import { useMemo, useState } from "react"

import SearchInput from "../../components/common/SearchInput"
import "./reportsPage.css"

function formatCurrency(value) {
  if (value === null || value === undefined) return "—"

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function ReportsPage({ data = {} }) {
  const [searchTerm, setSearchTerm] = useState("")

  const {
    summary = [],
    rows = [],
  } = data

  const reportSummary = Array.isArray(summary) ? summary : []
  const reportRows = Array.isArray(rows) ? rows : []

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return reportRows

    return reportRows.filter((row) =>
      [row.date, row.type, row.description, row.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [reportRows, searchTerm])

  return (
    <section className="reports-page">
      <header className="reports-page__header">
        <div>
          <span className="reports-page__eyebrow">Analisis</span>
          <h1 className="reports-page__title">Laporan</h1>
          <p className="reports-page__description">
            Tinjau ringkasan dan catatan laporan yang tersedia.
          </p>
        </div>
      </header>

      {reportSummary.length > 0 && (
        <section className="reports-summary" aria-label="Ringkasan laporan">
          {reportSummary.map((item) => (
            <article className="reports-summary__card" key={item.id}>
              <span>{item.label}</span>
              <strong>
                {item.format === "number"
                  ? item.value ?? "—"
                  : formatCurrency(item.value)}
              </strong>
              {item.detail && <small>{item.detail}</small>}
            </article>
          ))}
        </section>
      )}

      <section className="reports-card" aria-label="Rincian laporan">
        <div className="reports-card__toolbar">
          <div>
            <h2>Rincian laporan</h2>
            <p>{reportRows.length} catatan</p>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari tanggal, jenis, atau keterangan..."
            ariaLabel="Cari laporan"
          />
        </div>

        {filteredRows.length > 0 ? (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jenis</th>
                  <th>Keterangan</th>
                  <th>Kategori</th>
                  <th className="reports-table__amount-heading">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date || "—"}</td>
                    <td>{row.type || "—"}</td>
                    <td>{row.description || "—"}</td>
                    <td>{row.category || "—"}</td>
                    <td className="reports-table__amount">
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-empty">
            <strong>
              {searchTerm ? "Laporan tidak ditemukan" : "Belum ada data laporan"}
            </strong>
            <span>
              {searchTerm
                ? "Periksa kata kunci pencarian."
                : "Rincian laporan akan tampil di sini setelah data tersedia."}
            </span>
          </div>
        )}

        <footer className="reports-card__footer">
          Menampilkan {filteredRows.length} dari {reportRows.length} catatan
        </footer>
      </section>
    </section>
  )
}

export default ReportsPage