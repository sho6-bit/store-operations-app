import { useState } from "react"

import "./appLayout.css"

import Sidebar from "./Sidebar/Sidebar.jsx"
import TopBar from "./Topbar/TopBar.jsx"

import CashFlowPage from "../../pages/CashFlow/CashFlowPage.jsx"
import CustomersPage from "../../pages/Customers/CustomersPage.jsx"
import DashboardPage from "../../pages/Dashboard/DashboardPage.jsx"
import InventoryPage from "../../pages/Inventory/InventoryPage.jsx"
import PurchasesPage from "../../pages/Purchases/PurchasesPage.jsx"
import ReportsPage from "../../pages/Reports/ReportsPage.jsx"
import SalesPage from "../../pages/Sales/SalesPage.jsx"
import SettingPage from "../../pages/Settings/SettingsPage.jsx"
import SuppliersPage from "../../pages/Suppliers/SuppliersPage.jsx"

const pageTitles = {
  dashboard: "Dashboard",
  sales: "Penjualan",
  purchases: "Pembelian",
  inventory: "Stok",
  customers: "Customer",
  suppliers: "Supplier",
  cash: "Kas & Bank",
  reports: "Laporan",
  settings: "Pengaturan",
}

function AppLayout() {
  const [activeItem, setActiveItem] = useState("dashboard")
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState("all")
  const [searchValue, setSearchValue] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)

  function renderPage() {
    switch (activeItem) {
      case "sales": return <SalesPage />
      case "purchases": return <PurchasesPage />
      case "inventory": return <InventoryPage />
      case "customers": return <CustomersPage />
      case "suppliers": return <SuppliersPage />
      case "cash": return <CashFlowPage />
      case "reports":
        return (
          <ReportsPage
            selectedBusinessUnit={selectedBusinessUnit}
            onBusinessUnitChange={setSelectedBusinessUnit}
          />
        )
      case "settings": return <SettingPage />
      case "dashboard":
      default:
        return <DashboardPage selectedBusinessUnit={selectedBusinessUnit} />
    }
  }

  return (
    <div
      className={`app-layout ${isDarkMode ? "app-layout--dark" : ""}`}
      data-theme={isDarkMode ? "dark" : "light"}
    >
      <Sidebar
        activeItem={activeItem}
        onNavigate={setActiveItem}
        selectedBusinessUnit={selectedBusinessUnit}
        onBusinessUnitChange={setSelectedBusinessUnit}
      />
      <div className="app-layout__main">
        <TopBar
          title={pageTitles[activeItem] || "Dashboard"}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          isDarkMode={isDarkMode}
          onThemeToggle={() => setIsDarkMode((current) => !current)}
          userName="Admin"
          userRole="Administrator"
        />
        <main className="app-layout__content">{renderPage()}</main>
      </div>
    </div>
  )
}

export default AppLayout


