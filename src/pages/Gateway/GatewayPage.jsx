import { useState } from "react"
import { ArrowRight, Eye, EyeOff, LockKeyhole, Store } from "lucide-react"
import "./gatewayPage.css"

function GatewayPage({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!onLogin) return
    setError("")
    setIsSubmitting(true)
    try {
      await onLogin({ email: email.trim(), password })
    } catch (loginError) {
      setError(loginError?.message || "Login belum berhasil. Periksa email dan kata sandi.")
    } finally {
      setIsSubmitting(false)
    }
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
          <h1 id="gateway-title">Masuk</h1>
        </div>

        <form className="gateway-form" onSubmit={handleSubmit}>
          <label className="gateway-field">
            <span>Email</span>
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" required />
          </label>
          <label className="gateway-field">
            <span>Kata sandi</span>
            <span className="gateway-password">
              <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan kata sandi" required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {error && <p className="gateway-error" role="alert">{error}</p>}
          <button className="gateway-submit" type="submit" disabled={!onLogin || isSubmitting || !email.trim() || !password}>
            <span>{isSubmitting ? "Memeriksa akun..." : "Masuk"}</span><ArrowRight size={17} />
          </button>
          {!onLogin && <p className="gateway-notice">Login belum terhubung.</p>}
        </form>
      </section>
    </main>
  )
}

export default GatewayPage
