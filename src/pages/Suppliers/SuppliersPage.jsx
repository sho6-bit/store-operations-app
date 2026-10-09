import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"

import SearchInput from "../../components/common/SearchInput"
import SummaryCards from "../../components/common/SummaryCards"
import "./suppliersPage.css"

function SuppliersPage({ data = [], onCreateSupplier }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: "", address: "", phone: "" })
  const [formError, setFormError] = useState("")
  const suppliers = Array.isArray(data) ? data : []

  async function submitSupplier(event) {
    event.preventDefault()
    if (!form.name.trim()) { setFormError("Nama supplier wajib diisi."); return }
    try {
      await onCreateSupplier?.({ name: form.name.trim(), address: form.address.trim(), phone: form.phone.trim() })
      setForm({ name: "", address: "", phone: "" })
      setFormError("")
      setModalOpen(false)
    } catch (error) { setFormError(error?.message || "Supplier gagal disimpan.") }
  }
  const suppliersWithPhone = suppliers.filter((supplier) => supplier.phone).length
  const suppliersWithAddress = suppliers.filter((supplier) => supplier.address).length

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
        <Button onClick={() => { setForm({ name: "", address: "", phone: "" }); setFormError(""); setModalOpen(true) }}><Plus size={16} />Tambah Supplier</Button>
      </header>

      <SummaryCards cards={[
        { label: "Supplier terdaftar", value: suppliers.length, detail: "Jumlah data supplier", tone: "blue" },
        { label: "Memiliki nomor telepon", value: suppliersWithPhone, detail: "Berdasarkan data kontak", tone: "green" },
        { label: "Memiliki alamat", value: suppliersWithAddress, detail: "Berdasarkan data kontak", tone: "purple" },
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
            placeholder="Cari nama, telepon, atau alamat..."
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah supplier" size="medium">
        <form className="transaction-form" onSubmit={submitSupplier}>
          <label className="transaction-form__field"><span>Nama supplier <b>*</b></span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="transaction-form__field"><span>Alamat</span><textarea rows="3" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
          <label className="transaction-form__field"><span>Nomor HP</span><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          {formError && <p className="transaction-form__error" role="alert">{formError}</p>}
          <div className="transaction-form__actions"><Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Batal</Button><Button type="submit">Simpan supplier</Button></div>
        </form>
      </Modal>
    </section>
  )
}

export default SuppliersPage

