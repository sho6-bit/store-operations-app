import AppLayout from "./components/layout/AppLayout.jsx"
// import DashboardPage from "./pages/Dashboard/DashboardPage.jsx"
// import CashFlowPage from "./pages/CashFlow/CashFlowPage.jsx"
import CustomerPage from "./pages/Customers/CustomersPage.jsx"

function App() {
  return (
    <AppLayout>
      {/* <DashboardPage /> */}
      {/* <CashFlowPage /> */}
      <CustomerPage />
    </AppLayout>
  )
}

export default App