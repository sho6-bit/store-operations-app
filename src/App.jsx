import AppLayout from "./components/layout/AppLayout.jsx"
import GatewayPage from "./pages/Gateway/GatewayPage.jsx"

function App() {
  const isGatewayPreview = new URLSearchParams(window.location.search).get("page") === "gateway"

  return isGatewayPreview ? <GatewayPage /> : <AppLayout />
}

export default App
