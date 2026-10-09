import { useMemo, useState } from "react"
import { Download } from "lucide-react"
import Button from "../../components/common/Button"
import SearchInput from "../../components/common/SearchInput"
import "./reportsPage.css"

const businessUnits = [
  { id: "all", name: "Semua Unit Usaha" },
  { id: "furniture", name: "Furniture" },
  { id: "electronic-1", name: "Electronic 1" },
  { id: "electronic-2", name: "Electronic 2" },
]

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "—"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function ReportsPage({
  data = {},
  selectedBusinessUnit = "all",
  onBusinessUnitChange,
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const reportSummary = Array.isArray(data?.summary) ? data.summary : []
  const reportRows = Array.isArray(data?.rows) ? data.rows : []

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return reportRows.filter((row) => {
      const rowDate = row.date ? new Date(row.date) : null
      const hasValidDate = rowDate && !Number.isNaN(rowDate.getTime())
      const matchesStart = !startDate || !hasValidDate || rowDate >= new Date(startDate)
      const matchesEnd = !endDate || !hasValidDate || rowDate <= new Date(endDate + "T23:59:59")
      const selectedUnitName = businessUnits.find((unit) => unit.id === selectedBusinessUnit)?.name
      const rowUnit = row.businessUnitId ?? row.businessUnit
      const matchesUnit =
        selectedBusinessUnit === "all" ||
        rowUnit === selectedBusinessUnit ||
        rowUnit === selectedUnitName
      const matchesSearch =
        !query ||
        [row.date, row.type, row.description, row.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      return matchesStart && matchesEnd && matchesUnit && matchesSearch
    })
  }, [reportRows, searchTerm, startDate, endDate, selectedBusinessUnit])

  return (
    <section className="reports-page">
      <header className="reports-page__header">
        <div>
          <span className="reports-page__eyebrow">ANALISIS</span>
          <h1 className="reports-page__title">Laporan Bisnis</h1>
          <p className="reports-page__description">
            Tinjau laporan berdasarkan periode dan unit usaha.
          </p>
        </div>
        <Button variant="secondary" onClick={() => window.print()}><Download size={16} />Unduh PDF</Button>
      </header>

      <section className="reports-filters" aria-label="Filter laporan">
        <label className="reports-filter">
          <span>Mulai</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="reports-filter">
          <span>Sampai</span>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <label className="reports-filter reports-filter--unit">
          <span>Unit usaha</span>
          <select
            value={selectedBusinessUnit}
            onChange={(event) => onBusinessUnitChange?.(event.target.value)}
          >
            {businessUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </label>
      </section>

      {reportSummary.length > 0 && (
        <section className="reports-summary" aria-label="Ringkasan laporan">
          {reportSummary.map((item) => (
            <article className="reports-summary__card" key={item.id}>
              <span>{item.label}</span>
              <strong>
                {item.format === "number" ? item.value ?? "—" : formatCurrency(item.value)}
              </strong>
              {item.detail && <small>{item.detail}</small>}
            </article>
          ))}
        </section>
      )}

      <section className="reports-card" aria-label="Rincian laporan">
        <div className="reports-card__toolbar">
          <div>
            <h2>Laporan laba &amp; rugi</h2>
            <p>
              {businessUnits.find((unit) => unit.id === selectedBusinessUnit)?.name || "Unit usaha"}
              {startDate || endDate ? " · " + (startDate || "…") + " — " + (endDate || "…") : ""}
            </p>
          </div>
          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari keterangan laporan..."
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
                    <td className="reports-table__amount">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reports-empty">
            <strong>{searchTerm || startDate || endDate ? "Laporan tidak ditemukan" : "Laporan belum tersedia"}</strong>
            <span>
              {searchTerm || startDate || endDate
                ? "Sesuaikan filter untuk melihat catatan laporan."
                : "Ringkasan dan rincian akan tampil di sini setelah data laporan tersedia."}
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

