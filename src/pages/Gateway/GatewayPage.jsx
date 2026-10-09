import { useState } from "react"
import { ArrowRight, Eye, EyeOff, LockKeyhole, Store } from "lucide-react"
import "./gatewayPage.css"

function GatewayPage({ onLogin, onRequestPasswordReset }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setNotice("")
    setIsSubmitting(true)
    try {
      if (isResetMode) {
        await onRequestPasswordReset?.(email.trim())
        setNotice("Jika email terdaftar, tautan untuk mengatur ulang kata sandi akan dikirim.")
      } else {
        await onLogin?.({ email: email.trim(), password })
      }
    } catch (requestError) {
      setError(requestError?.message || "Permintaan belum berhasil. Coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function toggleResetMode() {
    setIsResetMode((current) => !current)
    setPassword("")
    setError("")
    setNotice("")
  }

  return (
    <main className="gateway-page">
      <section className="gateway-card" aria-labelledby="gateway-title">
        <div className="gateway-brand">
          <span className="gateway-brand__mark" aria-hidden="true"><Store size={24} strokeWidth={2.1} /></span>
          <strong>Toko Noni</strong>
        </div>

        <div className="gateway-heading">
          <span className="gateway-heading__icon" aria-hidden="true"><LockKeyhole size={19} /></span>
          <h1 id="gateway-title">{isResetMode ? "Atur ulang kata sandi" : "Masuk"}</h1>
        </div>

        <form className="gateway-form" onSubmit={handleSubmit}>
          <label className="gateway-field">
            <span>Email</span>
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" required />
          </label>
          {!isResetMode && <label className="gateway-field">
            <span>Kata sandi</span>
            <span className="gateway-password">
              <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan kata sandi" required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>}
          {error && <p className="gateway-error" role="alert">{error}</p>}
          {notice && <p className="gateway-success" role="status">{notice}</p>}
          <button className="gateway-submit" type="submit" disabled={isSubmitting || !email.trim() || (!isResetMode && !password) || (isResetMode ? !onRequestPasswordReset : !onLogin)}>
            <span>{isSubmitting ? "Memproses..." : isResetMode ? "Kirim tautan reset" : "Masuk"}</span><ArrowRight size={17} />
          </button>
          <button className="gateway-text-button" type="button" onClick={toggleResetMode}>
            {isResetMode ? "Kembali ke halaman masuk" : "Lupa kata sandi?"}
          </button>
        </form>
      </section>
    </main>
  )
}

export default GatewayPage
