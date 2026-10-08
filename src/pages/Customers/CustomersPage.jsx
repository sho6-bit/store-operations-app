import { useMemo, useState } from "react"
import { Pencil, Plus, Trash2, Users } from "lucide-react"

import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"
import SearchInput from "../../components/common/SearchInput"

import "./customersPage.css"

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
}

function CustomerPage({
  data = [],
  onCreateCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState("")

  const customers = Array.isArray(data) ? data : []

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return customers

    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email, customer.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [customers, searchTerm])

  function openCreateModal() {
    setEditingCustomer(null)
    setForm(emptyForm)
    setFormError("")
    setActionError("")
    setIsModalOpen(true)
  }

  function openEditModal(customer) {
    setEditingCustomer(customer)
    setForm({
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
    })
    setFormError("")
    setActionError("")
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return
    setIsModalOpen(false)
    setEditingCustomer(null)
    setForm(emptyForm)
    setFormError("")
  }

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError("")
    setActionError("")

    const name = form.name.trim()
    if (!name) {
      setFormError("Nama pelanggan wajib diisi.")
      return
    }

    const payload = {
      name,
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    }

    const handler = editingCustomer ? onUpdateCustomer : onCreateCustomer
    if (typeof handler !== "function") {
      setActionError(
        editingCustomer
          ? "Aksi edit belum tersambung ke penyimpanan data."
          : "Aksi tambah belum tersambung ke penyimpanan data.",
      )
      return
    }

    setIsSaving(true)
    try {
      if (editingCustomer) {
        await handler(editingCustomer.id, payload)
      } else {
        await handler(payload)
      }
      setIsModalOpen(false)
      setEditingCustomer(null)
      setForm(emptyForm)
    } catch (error) {
      setActionError(error?.message || "Pelanggan gagal disimpan.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(customer) {
    setActionError("")

    if (typeof onDeleteCustomer !== "function") {
      setActionError("Aksi hapus belum tersambung ke penyimpanan data.")
      return
    }

    try {
      await onDeleteCustomer(customer.id)
    } catch (error) {
      setActionError(error?.message || "Pelanggan gagal dihapus.")
    }
  }

  return (
    <section className="customer-page">
      <header className="customer-page__header">
        <div>
          <span className="customer-page__eyebrow">Data toko</span>
          <h1 className="customer-page__title">Pelanggan</h1>
          <p className="customer-page__description">
            Kelola informasi pelanggan yang tersimpan.
          </p>
        </div>

        <Button onClick={openCreateModal}>
          <Plus size={16} aria-hidden="true" />
          Tambah pelanggan
        </Button>
      </header>

      <section className="customer-card" aria-label="Daftar pelanggan">
        <div className="customer-card__toolbar">
          <div>
            <h2>Daftar pelanggan</h2>
            <p>{customers.length} pelanggan</p>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nama, telepon, atau email..."
            ariaLabel="Cari pelanggan"
          />
        </div>

        {actionError && (
          <p className="customer-message customer-message--error" role="alert">
            {actionError}
          </p>
        )}

        {filteredCustomers.length > 0 ? (
          <div className="customer-table-wrap">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Telepon</th>
                  <th>Email</th>
                  <th>Alamat</th>
                  <th className="customer-table__actions-heading">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                    </td>
                    <td>{customer.phone || "—"}</td>
                    <td>{customer.email || "—"}</td>
                    <td className="customer-table__address">
                      {customer.address || "—"}
                    </td>
                    <td>
                      <div className="customer-table__actions">
                        <button
                          className="customer-icon-button"
                          type="button"
                          aria-label={`Edit ${customer.name}`}
                          onClick={() => openEditModal(customer)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="customer-icon-button customer-icon-button--danger"
                          type="button"
                          aria-label={`Hapus ${customer.name}`}
                          onClick={() => handleDelete(customer)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="customer-empty">
            <div className="customer-empty__icon" aria-hidden="true">
              <Users size={22} />
            </div>
            <strong>
              {searchTerm ? "Pelanggan tidak ditemukan" : "Belum ada pelanggan"}
            </strong>
            <span>
              {searchTerm
                ? "Periksa kata kunci pencarian."
                : "Daftar ini akan menampilkan pelanggan dari data aplikasi."}
            </span>
          </div>
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCustomer ? "Edit pelanggan" : "Tambah pelanggan"}
        size="medium"
      >
        <form className="customer-form" onSubmit={handleSubmit}>
          <label className="customer-form__field">
            <span>Nama pelanggan <b aria-hidden="true">*</b></span>
            <input
              name="name"
              value={form.name}
              onChange={handleFieldChange}
              autoComplete="name"
              required
            />
          </label>

          <label className="customer-form__field">
            <span>Nomor telepon</span>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleFieldChange}
              autoComplete="tel"
            />
          </label>

          <label className="customer-form__field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleFieldChange}
              autoComplete="email"
            />
          </label>

          <label className="customer-form__field">
            <span>Alamat</span>
            <textarea
              name="address"
              value={form.address}
              onChange={handleFieldChange}
              rows={3}
              autoComplete="street-address"
            />
          </label>

          {formError && (
            <p className="customer-message customer-message--error" role="alert">
              {formError}
            </p>
          )}

          {actionError && (
            <p className="customer-message customer-message--error" role="alert">
              {actionError}
            </p>
          )}

          <div className="customer-form__actions">
            <Button
              variant="secondary"
              type="button"
              onClick={closeModal}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan pelanggan"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

export default CustomerPage