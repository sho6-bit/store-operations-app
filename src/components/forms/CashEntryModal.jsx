import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import Button from "../common/Button"
import Modal from "../common/Modal"
import "./transactionFormModal.css"

const defaultBusinessUnits = [{ id: "furniture", name: "Furniture" }, { id: "electronic-1", name: "Electronic 1" }, { id: "electronic-2", name: "Electronic 2" }]
const emptyForm = { type: "income", businessUnit: "", accountType: "cash", date: "", description: "", category: "", amount: "" }

function CashEntryModal({ isOpen, onClose, onSave, businessUnits = defaultBusinessUnits, initialEntry = null }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(initialEntry)

  useEffect(() => {
    if (!isOpen) return
    setError("")
    setForm(initialEntry ? {
      type: initialEntry.type || "income",
      businessUnit: initialEntry.businessUnit || "",
      accountType: initialEntry.accountType || "cash",
      date: initialEntry.date || "",
      description: initialEntry.description || "",
      category: initialEntry.category || "",
      amount: initialEntry.amount ?? "",
    } : emptyForm)
  }, [isOpen, initialEntry])

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })) }
  function close() {
    if (saving) return
    setError("")
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
      await onSave({ ...form, account: form.accountType === "cash" ? "Kas" : "Bank", amount: Number(form.amount), description: form.description.trim(), category: form.category.trim() }, initialEntry?.id)
      onClose?.()
    } catch (saveError) { setError(saveError?.message || "Catatan kas gagal disimpan.") }
    finally { setSaving(false) }
  }
  return (
    <Modal isOpen={isOpen} onClose={close} title={isEditing ? "Edit mutasi kas & bank" : "Tambah kas"} size="medium">
      <form className="transaction-form" onSubmit={submit}>{initialEntry && (initialEntry.sourceTransactionId || initialEntry.sourceSettlementId || initialEntry.transactionId) && <p className="cash-entry-linked-note">Mutasi ini terkait transaksi lain. Perubahan di sini hanya mengubah mutasi kas/bank, bukan data penjualan atau pembelian asal.</p>}
        <div className="transaction-form__grid">
          <label className="transaction-form__field"><span>Jenis <b>*</b></span><select value={form.type} onChange={(event) => update("type", event.target.value)}><option value="income">Kas masuk</option><option value="expense">Kas keluar</option></select></label>
          <label className="transaction-form__field"><span>Tanggal <b>*</b></span><input type="date" required value={form.date} onChange={(event) => update("date", event.target.value)} /></label>
          <label className="transaction-form__field"><span>Unit usaha <b>*</b></span><select required value={form.businessUnit} onChange={(event) => update("businessUnit", event.target.value)}><option value="">Pilih unit usaha</option>{businessUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
          <label className="transaction-form__field"><span>Akun <b>*</b></span><select value={form.accountType} onChange={(event) => update("accountType", event.target.value)}><option value="cash">Kas</option><option value="bank">Bank</option></select></label>
          <label className="transaction-form__field"><span>Jumlah (Rp) <b>*</b></span><input type="number" min="1" step="1" required value={form.amount} onChange={(event) => update("amount", event.target.value)} /></label>
          <label className="transaction-form__field"><span>Kategori</span><input value={form.category} placeholder="Contoh: operasional" onChange={(event) => update("category", event.target.value)} /></label>
          <label className="transaction-form__field transaction-form__field--wide"><span>Keterangan <b>*</b></span><input required value={form.description} placeholder="Keterangan transaksi kas" onChange={(event) => update("description", event.target.value)} /></label>
        </div>
        {error && <p className="transaction-form__error" role="alert">{error}</p>}
        <div className="transaction-form__actions"><Button variant="secondary" type="button" onClick={close} disabled={saving}>Batal</Button><Button type="submit" disabled={saving}><Plus size={16} />{saving ? "Menyimpan..." : isEditing ? "Simpan perubahan" : "Simpan catatan"}</Button></div>
      </form>
    </Modal>
  )
}
export default CashEntryModal
