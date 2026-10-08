import { useState } from "react"

import "./appLayout.css"

import Sidebar from "./Sidebar/Sidebar.jsx"
import TopBar from "./Topbar/TopBar.jsx"

function AppLayout({ children }) {
  const [activeItem, setActiveItem] = useState("dashboard")
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState("all")
  const [searchValue, setSearchValue] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)

  function handleNavigation(itemId) {
    setActiveItem(itemId)
  }

  function handleBusinessUnitChange(unitId) {
    setSelectedBusinessUnit(unitId)
  }

  function handleThemeToggle() {
    setIsDarkMode((current) => !current)
  }

  return (
    <div className={`app-layout ${isDarkMode ? "app-layout--dark" : ""}`}>
      <Sidebar
        activeItem={activeItem}
        onNavigate={handleNavigation}
        selectedBusinessUnit={selectedBusinessUnit}
        onBusinessUnitChange={handleBusinessUnitChange}
      />

      <div className="app-layout__main">
        <TopBar
          title="Dashboard"
          subtitle="Ringkasan operasional toko"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          isDarkMode={isDarkMode}
          onThemeToggle={handleThemeToggle}
          userName="Admin"
          userRole="Administrator"
          userInitials="TN"
        />

        <main className="app-layout__content">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout