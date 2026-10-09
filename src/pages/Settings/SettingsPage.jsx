import { useEffect, useRef, useState } from "react"
import { Download, Save, Upload, LogOut } from "lucide-react"
import Button from "../../components/common/Button"
import "./settingsPage.css"

function SettingsPage({ settings, storeData, onSaveSettings, onRestoreData }) {
  const [form, setForm] = useState(settings)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const fileInput = useRef(null)

  useEffect(() => setForm(settings), [settings])

  function updateProfile(key, value) {
    setForm((current) => ({ ...current, storeProfile: { ...current.storeProfile, [key]: value } }))
  }

  function updateUnit(id, value) {
    setForm((current) => ({ ...current, businessUnits: current.businessUnits.map((unit) => unit.id === id ? { ...unit, name: value } : unit) }))
  }

  function updateAccount(id, key, value) {
    setForm((current) => ({ ...current, accounts: { ...current.accounts, [id]: { ...current.accounts[id], [key]: value } } }))
  }

  function save(event) {
    event.preventDefault()
    if (!form.businessUnits.every((unit) => unit.name.trim()) || !form.businessUnits.every((unit) => form.accounts[unit.id]?.cash.trim() && form.accounts[unit.id]?.bank.trim())) {
      setError("Nama unit usaha serta nama akun kas dan bank wajib diisi.")
      setMessage("")
      return
    }
    onSaveSettings?.({
      ...form,
      storeProfile: { ...form.storeProfile, name: "Toko Noni" },
      businessUnits: form.businessUnits.map((unit) => ({ ...unit, name: unit.name.trim() })),
      stockLowThreshold: Math.max(0, Number(form.stockLowThreshold) || 0),
    })
    setError("")
    setMessage("Pengaturan berhasil disimpan.")
  }

  function exportBackup() {
    const file = new Blob([JSON.stringify({ store: storeData, settings: form }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = url
    link.download = "cadangan-store-operations.json"
    link.click()
    URL.revokeObjectURL(url)
    setMessage("Cadangan data berhasil diunduh.")
    setError("")
  }

  async function importBackup(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const backup = JSON.parse(await file.text())
      const requiredCollections = ["products", "customers", "suppliers", "sales", "purchases", "cashTransactions"]
      if (!backup?.store || !requiredCollections.every((key) => Array.isArray(backup.store[key]))) {
        throw new Error("File tidak berisi cadangan Store Operations yang valid.")
      }
      onRestoreData?.(backup)
      setMessage("Cadangan berhasil dipulihkan.")
      setError("")
    } catch (restoreError) {
      setError(restoreError.message || "File cadangan tidak dapat dibaca.")
      setMessage("")
    } finally {
      event.target.value = ""
    }
  }

  return (
    <section className="setting-page">
      <header className="setting-page__header">
        <div>
          <span className="setting-page__eyebrow">Aplikasi pribadi</span>
          <h1 className="setting-page__title">Pengaturan</h1>
          <p className="setting-page__description">Atur informasi toko, unit usaha, akun kas dan bank, serta cadangan data.</p>
        </div>
      </header>

      <form className="setting-page__form" onSubmit={save}>
        <section className="setting-card">
          <div className="setting-card__header"><h2>Profil toko</h2><p>Nama toko dikunci. Informasi kontak dan alamat dapat diubah.</p></div>
          <div className="setting-fields">
            <label className="setting-field"><span>Nama toko</span><input value="Toko Noni" readOnly aria-readonly="true" /></label>
            <label className="setting-field"><span>Profil / deskripsi toko</span><input value={form.storeProfile.description} onChange={(event) => updateProfile("description", event.target.value)} placeholder="Contoh: Toko furnitur dan elektronik" /></label>
            <label className="setting-field"><span>Kontak toko</span><input value={form.storeProfile.contact} onChange={(event) => updateProfile("contact", event.target.value)} placeholder="Nomor telepon atau WhatsApp" /></label>
            <label className="setting-field setting-field--wide"><span>Alamat toko</span><textarea rows="2" value={form.storeProfile.address} onChange={(event) => updateProfile("address", event.target.value)} placeholder="Alamat toko" /></label>
          </div>
        </section>

        <section className="setting-card">
          <div className="setting-card__header"><h2>Unit usaha dan akun</h2><p>Nama unit dan akun ini digunakan pada transaksi serta ringkasan Kas &amp; Bank.</p></div>
          <div className="setting-unit-list">
            {form.businessUnits.map((unit) => (
              <div className="setting-unit" key={unit.id}>
                <label className="setting-field"><span>Nama unit usaha</span><input value={unit.name} onChange={(event) => updateUnit(unit.id, event.target.value)} /></label>
                <label className="setting-field"><span>Akun kas</span><input value={form.accounts[unit.id]?.cash || ""} onChange={(event) => updateAccount(unit.id, "cash", event.target.value)} /></label>
                <label className="setting-field"><span>Akun bank</span><input value={form.accounts[unit.id]?.bank || ""} onChange={(event) => updateAccount(unit.id, "bank", event.target.value)} /></label>
              </div>
            ))}
          </div>
        </section>

        <section className="setting-card">
          <div className="setting-card__header"><h2>Inventori</h2><p>Produk akan dianggap menipis jika stoknya mencapai batas ini atau kurang, selama stok masih di atas nol.</p></div>
          <div className="setting-fields setting-fields--single">
            <label className="setting-field"><span>Batas stok menipis (unit)</span><input type="number" min="0" step="1" value={form.stockLowThreshold} onChange={(event) => setForm((current) => ({ ...current, stockLowThreshold: event.target.value }))} /></label>
          </div>
        </section>

        <section className="setting-card">
          <div className="setting-card__header"><h2>Akun dan sesi</h2><p>Menu keluar tersedia setelah aplikasi memiliki sistem login dan sesi akun.</p></div>
          <div className="setting-backup-actions">
            <Button type="button" variant="secondary" disabled title="Sistem login belum tersedia"><LogOut size={16} />Keluar belum tersedia</Button>
            <span className="setting-page__help">Saat ini aplikasi menggunakan profil Admin statis dan menyimpan data di browser ini.</span>
          </div>
        </section>

        <section className="setting-card">
          <div className="setting-card__header"><h2>Cadangan data</h2><p>Data tersimpan di browser ini. Unduh cadangan secara berkala agar dapat dipulihkan bila diperlukan.</p></div>
          <div className="setting-backup-actions">
            <Button type="button" variant="secondary" onClick={exportBackup}><Download size={16} />Unduh cadangan</Button>
            <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()}><Upload size={16} />Pulihkan cadangan</Button>
            <input ref={fileInput} className="setting-page__file" type="file" accept="application/json,.json" onChange={importBackup} />
          </div>
        </section>

        {(message || error) && <p className={error ? "setting-page__notice setting-page__notice--error" : "setting-page__notice"} role="status">{error || message}</p>}
        <div className="setting-page__actions"><Button type="submit"><Save size={16} />Simpan pengaturan</Button></div>
      </form>
    </section>
  )
}

export default SettingsPage
