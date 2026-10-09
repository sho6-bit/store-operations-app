import { useEffect, useState } from "react"
import AppLayout from "./components/layout/AppLayout.jsx"
import GatewayPage from "./pages/Gateway/GatewayPage.jsx"
import ResetPasswordPage from "./pages/Gateway/ResetPasswordPage.jsx"
import { supabase } from "./lib/supabaseClient.js"

function App() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRecoveryMode, setIsRecoveryMode] = useState(
    new URLSearchParams(window.location.search).get("page") === "reset-password",
  )

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session)
        setIsLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === "PASSWORD_RECOVERY") setIsRecoveryMode(true)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogin({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function handleRequestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/?page=reset-password",
    })
    if (error) throw error
  }

  async function handleSavePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    await supabase.auth.signOut()
    window.history.replaceState({}, "", window.location.pathname)
    setIsRecoveryMode(false)
    setSession(null)
  }

  if (isLoading) return <p style={{ padding: 24 }}>Memeriksa sesi...</p>

  if (isRecoveryMode) {
    return <ResetPasswordPage hasRecoverySession={Boolean(session)} onSavePassword={handleSavePassword} />
  }

  if (!session) {
    return <GatewayPage onLogin={handleLogin} onRequestPasswordReset={handleRequestPasswordReset} />
  }

  return <AppLayout />
}

export default App
