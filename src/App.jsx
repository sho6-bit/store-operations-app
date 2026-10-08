import AppLayout from "./components/layout/AppLayout.jsx"
// import DashboardPage from "./pages/Dashboard/DashboardPage.jsx"
import CashFlowPage from "./pages/CashFlow/CashFlowPage.jsx"

function App() {
  return (
    <AppLayout>
      {/* <DashboardPage /> */}
      <CashFlowPage />
    </AppLayout>
  )
}

export default App