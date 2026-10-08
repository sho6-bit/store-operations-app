import { useMemo, useState } from "react"

import SearchInput from "../../components/common/SearchInput"
import SummaryCards from "../../components/common/SummaryCards"
import "./suppliersPage.css"

function SuppliersPage({ data = [] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const suppliers = Array.isArray(data) ? data : []
  const suppliersWithPhone = suppliers.filter((supplier) => supplier.phone).length
  const suppliersWithEmail = suppliers.filter((supplier) => supplier.email).length

  const filteredSuppliers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return suppliers

    return suppliers.filter((supplier) =>
      [supplier.name, supplier.phone, supplier.email, supplier.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [suppliers, searchTerm])

  return (
    <section className="suppliers-page">
      <header className="suppliers-page__header">
        <div>
          <span className="suppliers-page__eyebrow">Data toko</span>
          <h1 className="suppliers-page__title">Supplier</h1>
          <p className="suppliers-page__description">
            Lihat informasi supplier yang tersedia.
          </p>
        </div>
      </header>

      <SummaryCards cards={[
        { label: "Supplier terdaftar", value: suppliers.length, detail: "Jumlah data supplier", tone: "blue" },
        { label: "Memiliki nomor telepon", value: suppliersWithPhone, detail: "Berdasarkan data kontak", tone: "green" },
        { label: "Memiliki email", value: suppliersWithEmail, detail: "Berdasarkan data kontak", tone: "purple" },
      ]} />

      <section className="suppliers-card" aria-label="Daftar supplier">
        <div className="suppliers-card__toolbar">
          <div>
            <h2>Daftar supplier</h2>
            <p>{suppliers.length} supplier</p>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nama, telepon, atau email..."
            ariaLabel="Cari supplier"
          />
        </div>

        {filteredSuppliers.length > 0 ? (
          <div className="suppliers-table-wrap">
            <table className="suppliers-table">
              <thead>
                <tr>
                  <th>Nama supplier</th>
                  <th>Telepon</th>
                  <th>Email</th>
                  <th>Alamat</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <strong>{supplier.name || "—"}</strong>
                    </td>
                    <td>{supplier.phone || "—"}</td>
                    <td>{supplier.email || "—"}</td>
                    <td className="suppliers-table__address">
                      {supplier.address || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="suppliers-empty">
            <strong>
              {searchTerm
                ? "Supplier tidak ditemukan"
                : "Belum ada data supplier"}
            </strong>
            <span>
              {searchTerm
                ? "Periksa kata kunci pencarian."
                : "Informasi supplier akan tampil di sini setelah datanya tersedia."}
            </span>
          </div>
        )}

        <footer className="suppliers-card__footer">
          Menampilkan {filteredSuppliers.length} dari {suppliers.length} supplier
        </footer>
      </section>
    </section>
  )
}

export default SuppliersPage

