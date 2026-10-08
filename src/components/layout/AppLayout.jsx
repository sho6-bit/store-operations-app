import { useState } from "react"

import "./AppLayout.css"

import Sidebar from "./Sidebar/Sidebar.jsx"
import TopBar from "./Topbar/TopBar.jsx"

function AppLayout({ children }) {
    const [activeItem, setActiveItem] = useState("dashboard")
    const [selectedBusinessUnit, setSelectedBusinessUnit] = useState("all")

    const [searchValue, setSearchValue] = useState("")

    const [isDarkMode, setIsDarkMode] = useState(false)

    const handleNavigation = (itemId) => {
        setActiveItem(itemId)
    }

    const handleBusinessUnitChange = (unitId) => {
        setSelectedBusinessUnit(unitId)
    }

    const handleThemeToggle = () => {
        setIsDarkMode((current) => !current)
    }

    return (
        <div
            className={`app-layout ${
                isDarkMode ? "app-layout--dark" : ""
            }`}
        >

            {/* SIDEBAR */}
            <Sidebar
                activeItem={activeItem}
                onNavigate={handleNavigation}
                selectedBusinessUnit={selectedBusinessUnit}
                onBusinessUnitChange={handleBusinessUnitChange}
            />


            {/* MAIN AREA */}
            <div className="app-layout__main">

                {/* TOP BAR */}
                <TopBar
                    title="Dashboard"
                    subtitle="Ringkasan operasional toko"

                    searchValue={searchValue}
                    onSearchChange={setSearchValue}

                    notificationCount={3}

                    isDarkMode={isDarkMode}
                    onThemeToggle={handleThemeToggle}

                    userName="Admin"
                    userRole="Administrator"
                    userInitials="AD"
                />


                {/* PAGE CONTENT */}
                <main className="app-layout__content">
                    {children}
                </main>

            </div>

        </div>
    )
}

export default AppLayout