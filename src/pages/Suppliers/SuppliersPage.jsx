import { useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"
import SearchInput from "../../components/common/SearchInput"
import SummaryCards from "../../components/common/SummaryCards"
import "./suppliersPage.css"

const emptyForm = { name: "", address: "", phone: "" }

function SuppliersPage({ data = [], onCreateSupplier, onUpdateSupplier, onDeleteSupplier, globalSearchValue = "" }) {
  const [searchTerm, setSearchTerm] = useState("")
  useEffect(() => { setSearchTerm(globalSearchValue) }, [globalSearchValue])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState("")
  const [actionError, setActionError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const suppliers = Array.isArray(data) ? data : []

  const suppliersWithPhone = suppliers.filter((supplier) => supplier.phone).length
  const suppliersWithAddress = suppliers.filter((supplier) => supplier.address).length

  const filteredSuppliers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return suppliers
    return suppliers.filter((supplier) => [supplier.name, supplier.phone, supplier.email, supplier.address]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
  }, [suppliers, searchTerm])

  function openCreateModal() {
    setEditingSupplier(null)
    setForm(emptyForm)
    setFormError("")
    setActionError("")
    setModalOpen(true)
  }

  function openEditModal(supplier) {
    setEditingSupplier(supplier)
    setForm({ name: supplier.name ?? "", address: supplier.address ?? "", phone: supplier.phone ?? "" })
    setFormError("")
    setActionError("")
    setModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return
    setModalOpen(false)
    setEditingSupplier(null)
    setForm(emptyForm)
    setFormError("")
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError("")
    setActionError("")
    const name = form.name.trim()
    if (!name) {
      setFormError("Nama supplier wajib diisi.")
      return
    }

    const payload = { name, address: form.address.trim(), phone: form.phone.trim() }
    const handler = editingSupplier ? onUpdateSupplier : onCreateSupplier
    if (typeof handler !== "function") {
      setActionError(editingSupplier ? "Aksi edit belum tersambung ke penyimpanan data." : "Aksi tambah belum tersambung ke penyimpanan data.")
      return
    }

    setIsSaving(true)
    try {
      if (editingSupplier) await handler(editingSupplier.id, payload)
      else await handler(payload)
      setModalOpen(false)
      setEditingSupplier(null)
      setForm(emptyForm)
    } catch (error) {
      setActionError(error?.message || "Supplier gagal disimpan.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(supplier) {
    setActionError("")
    if (!window.confirm("Hapus data supplier “" + supplier.name + "”?")) return
    if (typeof onDeleteSupplier !== "function") {
      setActionError("Aksi hapus belum tersambung ke penyimpanan data.")
      return
    }
    try {
      await onDeleteSupplier(supplier.id)
    } catch (error) {
      setActionError(error?.message || "Supplier gagal dihapus.")
    }
  }

  return (
    <section className="suppliers-page">
      <header className="suppliers-page__header">
        <div><span className="suppliers-page__eyebrow">Data toko</span><h1 className="suppliers-page__title">Supplier</h1><p className="suppliers-page__description">Kelola informasi supplier yang tersimpan.</p></div>
        <Button onClick={openCreateModal}><Plus size={16} />Tambah Supplier</Button>
      </header>

      <SummaryCards cards={[
        { label: "Supplier terdaftar", value: suppliers.length, detail: "Jumlah data supplier", tone: "blue" },
        { label: "Memiliki nomor telepon", value: suppliersWithPhone, detail: "Berdasarkan data kontak", tone: "green" },
        { label: "Memiliki alamat", value: suppliersWithAddress, detail: "Berdasarkan data kontak", tone: "purple" },
      ]} />

      <section className="suppliers-card" aria-label="Daftar supplier">
        <div className="suppliers-card__toolbar"><div><h2>Daftar supplier</h2><p>{suppliers.length} supplier</p></div>
          <SearchInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari nama, telepon, atau alamat..." ariaLabel="Cari supplier" />
        </div>
        {actionError && <p className="suppliers-message" role="alert">{actionError}</p>}

        {filteredSuppliers.length > 0 ? (
          <div className="suppliers-table-wrap"><table className="suppliers-table">
            <thead><tr><th>Nama supplier</th><th>Telepon</th><th>Alamat</th><th className="suppliers-table__actions-heading">Aksi</th></tr></thead>
            <tbody>{filteredSuppliers.map((supplier) => <tr key={supplier.id}>
              <td><strong>{supplier.name || "—"}</strong></td><td>{supplier.phone || "—"}</td><td className="suppliers-table__address">{supplier.address || "—"}</td>
              <td><div className="suppliers-table__actions">
                <button className="suppliers-icon-button" type="button" aria-label={`Edit ${supplier.name}`} title="Edit supplier" onClick={() => openEditModal(supplier)}><Pencil size={15} /></button>
                <button className="suppliers-icon-button suppliers-icon-button--danger" type="button" aria-label={`Hapus ${supplier.name}`} title="Hapus supplier" onClick={() => handleDelete(supplier)}><Trash2 size={15} /></button>
              </div></td>
            </tr>)}</tbody>
          </table></div>
        ) : (
          <div className="suppliers-empty"><strong>{searchTerm ? "Supplier tidak ditemukan" : "Belum ada data supplier"}</strong><span>{searchTerm ? "Periksa kata kunci pencarian." : "Informasi supplier akan tampil di sini setelah datanya tersedia."}</span></div>
        )}
        <footer className="suppliers-card__footer">Menampilkan {filteredSuppliers.length} dari {suppliers.length} supplier</footer>
      </section>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingSupplier ? "Edit supplier" : "Tambah supplier"} size="medium">
        <form className="transaction-form" onSubmit={handleSubmit}>
          <label className="transaction-form__field"><span>Nama supplier <b>*</b></span><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
          <label className="transaction-form__field"><span>Alamat</span><textarea rows="3" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></label>
          <label className="transaction-form__field"><span>Nomor HP</span><input type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></label>
          {formError && <p className="transaction-form__error" role="alert">{formError}</p>}
          {actionError && <p className="transaction-form__error" role="alert">{actionError}</p>}
          <div className="transaction-form__actions"><Button variant="secondary" type="button" onClick={closeModal} disabled={isSaving}>Batal</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Menyimpan..." : editingSupplier ? "Simpan perubahan" : "Simpan supplier"}</Button></div>
        </form>
      </Modal>
    </section>
  )
}

export default SuppliersPage
