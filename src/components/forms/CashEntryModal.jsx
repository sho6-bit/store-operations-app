import { useState } from "react"
import { Plus } from "lucide-react"
import Button from "../common/Button"
import Modal from "../common/Modal"
import "./transactionFormModal.css"

function CashEntryModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ type: "income", businessUnit: "", accountType: "cash", date: "", description: "", category: "", amount: "" })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })) }
  function close() {
    if (saving) return
    setError("")
    setForm({ type: "income", businessUnit: "", accountType: "cash", date: "", description: "", category: "", amount: "" })
    onClose?.()
  }
  async function submit(event) {
    event.preventDefault()
    if (!form.businessUnit || !form.date || !form.description.trim() || Number(form.amount) <= 0) {
      setError("Unit, tanggal, keterangan, dan jumlah lebih dari nol wajib diisi.")
      return
    }
    setSaving(true)
    try {
      await onSave({ ...form, account: form.accountType === "cash" ? "Kas" : "Bank", amount: Number(form.amount), description: form.description.trim(), category: form.category.trim() })
      setForm({ type: "income", businessUnit: "", accountType: "cash", date: "", description: "", category: "", amount: "" })
      onClose?.()
    } catch (saveError) { setError(saveError?.message || "Catatan kas gagal disimpan.") }
    finally { setSaving(false) }
  }
  return (
    <Modal isOpen={isOpen} onClose={close} title="Tambah kas" size="medium">
      <form className="transaction-form" onSubmit={submit}>
        <div className="transaction-form__grid">
          <label className="transaction-form__field"><span>Jenis <b>*</b></span><select value={form.type} onChange={(event) => update("type", event.target.value)}><option value="income">Kas masuk</option><option value="expense">Kas keluar</option></select></label>
          <label className="transaction-form__field"><span>Tanggal <b>*</b></span><input type="date" required value={form.date} onChange={(event) => update("date", event.target.value)} /></label>
          <label className="transaction-form__field"><span>Unit usaha <b>*</b></span><select required value={form.businessUnit} onChange={(event) => update("businessUnit", event.target.value)}><option value="">Pilih unit usaha</option><option value="furniture">Furniture</option><option value="electronic-1">Electronic 1</option><option value="electronic-2">Electronic 2</option></select></label>
          <label className="transaction-form__field"><span>Akun <b>*</b></span><select value={form.accountType} onChange={(event) => update("accountType", event.target.value)}><option value="cash">Kas</option><option value="bank">Bank</option></select></label>
          <label className="transaction-form__field"><span>Jumlah (Rp) <b>*</b></span><input type="number" min="1" step="1" required value={form.amount} onChange={(event) => update("amount", event.target.value)} /></label>
          <label className="transaction-form__field"><span>Kategori</span><input value={form.category} placeholder="Contoh: operasional" onChange={(event) => update("category", event.target.value)} /></label>
          <label className="transaction-form__field transaction-form__field--wide"><span>Keterangan <b>*</b></span><input required value={form.description} placeholder="Keterangan transaksi kas" onChange={(event) => update("description", event.target.value)} /></label>
        </div>
        {error && <p className="transaction-form__error" role="alert">{error}</p>}
        <div className="transaction-form__actions"><Button variant="secondary" type="button" onClick={close} disabled={saving}>Batal</Button><Button type="submit" disabled={saving}><Plus size={16} />{saving ? "Menyimpan..." : "Simpan catatan"}</Button></div>
      </form>
    </Modal>
  )
}
export default CashEntryModal
