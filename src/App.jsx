import AppLayout from "./components/layout/AppLayout.jsx"

// import DashboardPage from "./pages/Dashboard/DashboardPage.jsx"
// import CashFlowPage from "./pages/CashFlow/CashFlowPage.jsx"
// import CustomerPage from "./pages/Customers/CustomersPage.jsx"
// import InventoryPage from "./pages/Inventory/InventoryPage.jsx"
// import PurchasesPage from "./pages/Purchases/PurchasesPage.jsx"
// import ProductsPage from "./pages/Products/ProductsPage.jsx"
import ReportsPage from "./pages/Reports/ReportsPage.jsx"

function App() {
  return (
    <AppLayout>
      {/* <DashboardPage /> */}
      {/* <CashFlowPage /> */}
      {/* <CustomerPage /> */}
      {/* <InventoryPage /> */}
      {/* <PurchasesPage /> */}
      {/* <ProductsPage /> */}
      <ReportsPage />
    </AppLayout>
  )
}

export default App