import { useMemo, useState } from "react"
import { HandCoins, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react"
import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"
import NumberInput from "../../components/common/NumberInput.jsx"
import "./loansPage.css"

function today() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}
function money(value) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0) }
function paidTotal(loan) { return (loan.repayments || []).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) }
function accountKey(unit, type) { return unit + "::" + type }

function LoansPage({ loans = [], businessUnits = [], accounts = {}, onSaveLoan, onRepayLoan, onDeleteLoan }) {
  const [loanModal, setLoanModal] = useState(null)
  const [repaymentLoanId, setRepaymentLoanId] = useState("")
  const [loanForm, setLoanForm] = useState(null)
  const [repaymentForm, setRepaymentForm] = useState(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const accountOptions = useMemo(() => businessUnits.flatMap((unit) => [
    { value: accountKey(unit.id, "cash"), businessUnit: unit.id, accountType: "cash", label: accounts[unit.id]?.cash || "Kas " + unit.name },
    { value: accountKey(unit.id, "bank"), businessUnit: unit.id, accountType: "bank", label: accounts[unit.id]?.bank || "Bank " + unit.name },
  ]), [businessUnits, accounts])
  const openLoans = loans.filter((loan) => Number(loan.totalAmount) - paidTotal(loan) > 0)
  const outstandingTotal = loans.reduce((sum, loan) => sum + Math.max(0, Number(loan.totalAmount) - paidTotal(loan)), 0)

  function openLoanForm(loan = null) {
    const first = loan?.allocations?.[0]
    const second = loan?.allocations?.[1]
    setError("")
    setLoanForm({ borrowerName: loan?.borrowerName || "", date: loan?.date || today(), note: loan?.note || "", account1: first ? accountKey(first.businessUnit, first.accountType) : "", amount1: first ? String(first.amount) : "", account2: second ? accountKey(second.businessUnit, second.accountType) : "", amount2: second ? String(second.amount) : "" })
    setLoanModal(loan)
  }
  function openRepayment(loan = null) {
    const target = loan || openLoans[0]
    setError(""); setRepaymentLoanId(target?.id || ""); setRepaymentForm({ date: today(), account: "", amount: "", note: "" })
  }

  async function submitLoan(event) {
    event.preventDefault(); setError("")
    if (!loanForm.borrowerName.trim() || !loanForm.date) { setError("Nama peminjam dan tanggal pinjam wajib diisi."); return }
    const allocations = [
      { key: loanForm.account1, amount: Number(loanForm.amount1) || 0 },
      { key: loanForm.account2, amount: Number(loanForm.amount2) || 0 },
    ].filter((item) => item.key && item.amount > 0).map((item) => {
      const option = accountOptions.find((entry) => entry.value === item.key)
      return { businessUnit: option.businessUnit, accountType: option.accountType, amount: item.amount }
    })
    if (!allocations.length) { setError("Pilih minimal satu akun dan isi nominal pinjaman."); return }
    if ((loanForm.account1 && !(Number(loanForm.amount1) > 0)) || (loanForm.account2 && !(Number(loanForm.amount2) > 0))) { setError("Isi nominal untuk setiap akun yang dipilih."); return }
    if (loanForm.account1 && loanForm.account1 === loanForm.account2) { setError("Pilih akun yang berbeda untuk sumber kedua."); return }
    setSaving(true)
    try { await onSaveLoan({ borrowerName: loanForm.borrowerName, date: loanForm.date, note: loanForm.note, allocations }, loanModal?.id || null); setLoanModal(null); setLoanForm(null) }
    catch (saveError) { setError(saveError?.message || "Pinjaman gagal disimpan.") }
    finally { setSaving(false) }
  }
  async function submitRepayment(event) {
    event.preventDefault(); setError("")
    const option = accountOptions.find((entry) => entry.value === repaymentForm.account)
    if (!repaymentLoanId || !repaymentForm.date || !option || !(Number(repaymentForm.amount) > 0)) { setError("Pilih pinjaman, akun penerima, tanggal, dan nominal pembayaran."); return }
    setSaving(true)
    try { await onRepayLoan(repaymentLoanId, { date: repaymentForm.date, amount: Number(repaymentForm.amount), businessUnit: option.businessUnit, accountType: option.accountType, note: repaymentForm.note }); setRepaymentForm(null); setRepaymentLoanId("") }
    catch (saveError) { setError(saveError?.message || "Pengembalian pinjaman gagal disimpan.") }
    finally { setSaving(false) }
  }
  function removeLoan(loan) {
    const repaid = paidTotal(loan)
    const prompt = "Hapus pinjaman " + loan.borrowerName + " sebesar " + money(loan.totalAmount) + "?" + (repaid ? "\n\nCatatan pengembalian dan mutasi kas/bank yang terkait juga akan dihapus." : "\n\nMutasi kas/bank pinjaman yang terkait juga akan dihapus.")
    if (window.confirm(prompt)) onDeleteLoan(loan.id)
  }

  function loanRow(loan) {
    const remaining = Math.max(0, Number(loan.totalAmount) - paidTotal(loan))
    const sources = (loan.allocations || []).map((allocation) => {
      const unit = businessUnits.find((entry) => entry.id === allocation.businessUnit)
      return (accounts[allocation.businessUnit]?.[allocation.accountType] || (allocation.accountType === "cash" ? "Kas " : "Bank ") + (unit?.name || allocation.businessUnit)) + " " + money(allocation.amount)
    }).join(" + ")
    return { remaining, sources }
  }

  return (
    <section className="loans-page">
      <header className="loans-page__header"><div><span className="loans-page__eyebrow">KEUANGAN</span><h1>Pinjaman</h1><p>Catat dana yang dipinjam dari kas atau bank dan pantau pengembaliannya.</p></div><div className="loans-page__buttons"><Button variant="secondary" onClick={() => openRepayment()} disabled={!openLoans.length}><RotateCcw size={16} />Kembalikan Pinjaman</Button><Button onClick={() => openLoanForm()}><Plus size={16} />Pinjam</Button></div></header>
      <div className="loans-page__summary"><article><span>Total pinjaman tercatat</span><strong>{money(loans.reduce((sum, loan) => sum + Number(loan.totalAmount || 0), 0))}</strong></article><article><span>Sisa pinjaman belum lunas</span><strong>{money(outstandingTotal)}</strong></article><article><span>Data peminjaman</span><strong>{loans.length}</strong></article></div>
      <section className="loans-card"><div className="loans-card__heading"><div><h2>Data peminjaman</h2><p>{loans.length} pinjaman</p></div></div>
        {loans.length ? <>
          <div className="loans-table-wrap"><table className="loans-table"><thead><tr><th>Tanggal</th><th>Nama peminjam</th><th>Nominal total</th><th>Sisa</th><th>Status</th><th>Note</th><th>Aksi</th></tr></thead><tbody>{[...loans].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((loan) => { const { remaining, sources } = loanRow(loan); return <tr key={loan.id}><td data-label="Tanggal">{loan.date}</td><td data-label="Nama peminjam"><strong>{loan.borrowerName}</strong><small>{sources}</small></td><td data-label="Nominal total">{money(loan.totalAmount)}</td><td data-label="Sisa">{money(remaining)}</td><td data-label="Status"><span className={"loan-status " + (remaining ? "loan-status--open" : "loan-status--paid")}>{remaining ? "Belum lunas" : "Lunas"}</span></td><td data-label="Note">{loan.note || "—"}</td><td data-label="Aksi"><div className="loans-row-actions">{remaining > 0 && <button type="button" title="Kembalikan pinjaman" aria-label="Kembalikan pinjaman" onClick={() => openRepayment(loan)}><RotateCcw size={16} /></button>}<button type="button" title="Edit pinjaman" aria-label="Edit pinjaman" onClick={() => openLoanForm(loan)}><Pencil size={16} /></button><button className="loans-row-actions__delete" type="button" title="Hapus pinjaman" aria-label="Hapus pinjaman" onClick={() => removeLoan(loan)}><Trash2 size={16} /></button></div></td></tr> })}</tbody></table></div>
          <div className="loans-mobile-list">{[...loans].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((loan) => { const { remaining } = loanRow(loan); return <article className="loan-mobile-card" key={loan.id}><div><span>Tanggal</span><strong>{loan.date}</strong></div><div><span>Nama peminjam</span><strong>{loan.borrowerName}</strong></div><div><span>Nominal total</span><strong>{money(loan.totalAmount)}</strong></div><div><span>Sisa pinjaman</span><strong>{money(remaining)}</strong></div><div><span>Status</span><strong className={"loan-status " + (remaining ? "loan-status--open" : "loan-status--paid")}>{remaining ? "Belum lunas" : "Lunas"}</strong></div><div><span>Note</span><strong>{loan.note || "—"}</strong></div><div className="loans-row-actions">{remaining > 0 && <button type="button" onClick={() => openRepayment(loan)} aria-label="Kembalikan pinjaman"><RotateCcw size={16} /></button>}<button type="button" onClick={() => openLoanForm(loan)} aria-label="Edit pinjaman"><Pencil size={16} /></button><button className="loans-row-actions__delete" type="button" onClick={() => removeLoan(loan)} aria-label="Hapus pinjaman"><Trash2 size={16} /></button></div></article> })}</div>
        </> : <div className="loans-empty"><HandCoins size={28} /><strong>Belum ada data pinjaman</strong><span>Gunakan tombol Pinjam untuk mencatat peminjaman pertama.</span></div>}
      </section>

      <Modal isOpen={Boolean(loanForm)} onClose={() => { if (!saving) { setLoanForm(null); setLoanModal(null); setError("") } }} title={loanModal ? "Edit pinjaman" : "Pinjam"} size="large">
        {loanForm && <form className="transaction-form" onSubmit={submitLoan}><div className="loan-form__grid">
          <label className="transaction-form__field"><span>Kas / bank sumber 1 <b>*</b></span><select value={loanForm.account1} onChange={(event) => setLoanForm((current) => ({ ...current, account1: event.target.value }))}><option value="">Pilih akun</option>{accountOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="transaction-form__field"><span>Kas / bank sumber 2</span><select value={loanForm.account2} onChange={(event) => setLoanForm((current) => ({ ...current, account2: event.target.value }))}><option value="">Tidak digunakan</option>{accountOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="transaction-form__field"><span>Nominal sumber 1 (Rp) <b>*</b></span><NumberInput min="1" value={loanForm.amount1} onChange={(value) => setLoanForm((current) => ({ ...current, amount1: value }))} /></label>
          <label className="transaction-form__field"><span>Nominal sumber 2 (Rp)</span><NumberInput min="0" value={loanForm.amount2} onChange={(value) => setLoanForm((current) => ({ ...current, amount2: value }))} disabled={!loanForm.account2} /></label>
          <label className="transaction-form__field"><span>Nama peminjam <b>*</b></span><input value={loanForm.borrowerName} onChange={(event) => setLoanForm((current) => ({ ...current, borrowerName: event.target.value }))} required /></label>
          <label className="transaction-form__field"><span>Tanggal pinjam <b>*</b></span><input type="date" value={loanForm.date} onChange={(event) => setLoanForm((current) => ({ ...current, date: event.target.value }))} required /></label>
          <label className="transaction-form__field loan-form__wide"><span>Note</span><textarea rows="3" value={loanForm.note} onChange={(event) => setLoanForm((current) => ({ ...current, note: event.target.value }))} /></label>
        </div><div className="loan-form__total"><span>Total pinjaman</span><strong>{money((Number(loanForm.amount1) || 0) + (Number(loanForm.amount2) || 0))}</strong></div>
          {error && <p className="transaction-form__error" role="alert">{error}</p>}<div className="transaction-form__actions"><Button variant="secondary" type="button" onClick={() => { setLoanForm(null); setLoanModal(null); setError("") }} disabled={saving}>Batal</Button><Button type="submit" disabled={saving}><Plus size={16} />{saving ? "Menyimpan..." : loanModal ? "Simpan perubahan" : "Simpan pinjaman"}</Button></div>
        </form>}
      </Modal>

      <Modal isOpen={Boolean(repaymentForm)} onClose={() => { if (!saving) { setRepaymentForm(null); setError("") } }} title="Kembalikan pinjaman" size="medium">
        {repaymentForm && <form className="transaction-form" onSubmit={submitRepayment}><label className="transaction-form__field"><span>Pilih data peminjaman <b>*</b></span><select value={repaymentLoanId} onChange={(event) => setRepaymentLoanId(event.target.value)} required><option value="">Pilih pinjaman</option>{openLoans.map((loan) => <option key={loan.id} value={loan.id}>{loan.borrowerName} · sisa {money(Number(loan.totalAmount) - paidTotal(loan))}</option>)}</select></label>
          {repaymentLoanId && (() => { const selected = openLoans.find((loan) => loan.id === repaymentLoanId); return selected ? <p className="loan-form__remaining">Sisa pinjaman: <strong>{money(Number(selected.totalAmount) - paidTotal(selected))}</strong></p> : null })()}
          <label className="transaction-form__field"><span>Tanggal bayar <b>*</b></span><input type="date" value={repaymentForm.date} onChange={(event) => setRepaymentForm((current) => ({ ...current, date: event.target.value }))} required /></label>
          <label className="transaction-form__field"><span>Metode / akun pembayaran <b>*</b></span><select value={repaymentForm.account} onChange={(event) => setRepaymentForm((current) => ({ ...current, account: event.target.value }))} required><option value="">Pilih akun penerima</option>{accountOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="transaction-form__field"><span>Nominal dibayar (Rp) <b>*</b></span><NumberInput min="1" value={repaymentForm.amount} onChange={(value) => setRepaymentForm((current) => ({ ...current, amount: value }))} required /></label>
          <label className="transaction-form__field"><span>Note</span><textarea rows="3" value={repaymentForm.note} onChange={(event) => setRepaymentForm((current) => ({ ...current, note: event.target.value }))} /></label>
          {error && <p className="transaction-form__error" role="alert">{error}</p>}<div className="transaction-form__actions"><Button variant="secondary" type="button" onClick={() => { setRepaymentForm(null); setError("") }} disabled={saving}>Batal</Button><Button type="submit" disabled={saving}><RotateCcw size={16} />{saving ? "Menyimpan..." : "Simpan pembayaran"}</Button></div>
        </form>}
      </Modal>
    </section>
  )
}

export default LoansPage
