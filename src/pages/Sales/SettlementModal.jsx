import { useState } from "react"
import { CircleDollarSign } from "lucide-react"
import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"
import "../../components/forms/transactionFormModal.css"

function SettlementModal({ sale, onClose, onSave }) {
  const [date, setDate] = useState("")
  const [channel, setChannel] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const remaining = Number(sale?.remainingAmount ?? sale?.total ?? 0)

  async function submit(event) {
    event.preventDefault()
    if (!date || !channel || remaining <= 0) {
      setError("Tanggal dan saluran pembayaran wajib diisi.")
      return
    }
    setSaving(true)
    try {
      await onSave({ transactionId: sale.id, date, channel })
      onClose()
    } catch (saveError) {
      setError(saveError?.message || "Pelunasan gagal dicatat.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={Boolean(sale)} onClose={onClose} title="Catat pelunasan" size="medium">
      {sale && <form className="transaction-form" onSubmit={submit}>
        <p className="settlement-modal__invoice">Invoice <strong>{sale.number}</strong><br />Sisa piutang <strong>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(remaining)}</strong></p>
        <label className="transaction-form__field"><span>Tanggal pelunasan <b>*</b></span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label className="transaction-form__field"><span>Diterima melalui <b>*</b></span><select value={channel} onChange={(event) => setChannel(event.target.value)} required><option value="">Pilih saluran</option><option value="Cash">Cash</option><option value="QRIS">QRIS</option><option value="Transfer Bank">Transfer Bank</option></select></label>
        {error && <p className="transaction-form__error" role="alert">{error}</p>}
        <div className="transaction-form__actions"><Button variant="secondary" type="button" onClick={onClose} disabled={saving}>Batal</Button><Button type="submit" disabled={saving}><CircleDollarSign size={16} />{saving ? "Menyimpan..." : "Catat pelunasan"}</Button></div>
      </form>}
    </Modal>
  )
}

export default SettlementModal
