import { useState } from "react"
import { ArrowRight, KeyRound, Store } from "lucide-react"
import "./gatewayPage.css"

function ResetPasswordPage({ hasRecoverySession, onSavePassword }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    if (!hasRecoverySession) {
      setError("Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman masuk.")
      return
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi belum sama.")
      return
    }
    setIsSaving(true)
    try {
      await onSavePassword(password)
    } catch (saveError) {
      setError(saveError?.message || "Kata sandi belum berhasil diperbarui.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="gateway-page">
      <section className="gateway-card" aria-labelledby="reset-password-title">
        <div className="gateway-brand"><span className="gateway-brand__mark" aria-hidden="true"><Store size={24} /></span><strong>Toko Noni</strong></div>
        <div className="gateway-heading"><span className="gateway-heading__icon" aria-hidden="true"><KeyRound size={19} /></span><h1 id="reset-password-title">Buat kata sandi baru</h1></div>
        <form className="gateway-form" onSubmit={handleSubmit}>
          <label className="gateway-field"><span>Kata sandi baru</span><input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 8 karakter" required /></label>
          <label className="gateway-field"><span>Ulangi kata sandi baru</span><input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ketik ulang kata sandi" required /></label>
          {error && <p className="gateway-error" role="alert">{error}</p>}
          <button className="gateway-submit" type="submit" disabled={!hasRecoverySession || isSaving || !password || !confirmPassword}><span>{isSaving ? "Menyimpan..." : "Simpan kata sandi"}</span><ArrowRight size={17} /></button>
        </form>
      </section>
    </main>
  )
}

export default ResetPasswordPage
