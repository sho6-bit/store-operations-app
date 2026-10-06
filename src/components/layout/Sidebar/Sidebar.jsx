import { useState } from "react"
import {
    LayoutDashboard,
    ShoppingCard,
    ShoppingBag,
    Package,
    User,
    Truck,
    WalletCards,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Bell,
    CircleUseRound,
} from "lucide-react"

import "src/components/layout/Sidebar/sidebar.css"

const navigationItems = [

    {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
    },

    {
        id: "sales",
        label: "Penjualan",
        icon: ShoppingCard,
    },

    {
        id: "purchases",
        label: "Pembelian",
        icon: ShoppingBag
    },

    {
        id: "inventory",
        label: "Stok",
        icon: Package,
        badge: 7,
    },

    {
        id: "customers",
        label: "Customer",
        icon: User,
    },

    {
        id: "suppliers",
        label: "Supplier",
        icon: Truck,
    },

    {
        id: "cash",
        label: "Kas & Bank",
        icon: WalletCards
    },

    {
        id: "reports",
        label: "Laporan",
        icon: BarChart3,
    },

    {
        id: "settings",
        label: "Pengaturan",
        icon: Settings,
    },

]

const businessUnits = [

    {
        id: "all",
        name: "Semua Unit Usaha",
    },

    {
        id: "furniture",
        name: "Furniture",
    },

    {
        id: "electronic-1",
        name: "Electronic 1"
    },

    {
        id: "electronic-2",
        name: "Electronic 2",
    },

]

function Sidebar({
    activeItem = "dashboard",
    onNavigate,
    selectedBusinessUnit = "all",
    onBusinessUnitChange,
}) {
    const [collapsed, setCollapsed] = useState(false)
    const [showBusinessUnits, setShowBusinessUnits] = useState(false)

    const currentBusinessUnit = 
        businessUnits.find((item) => item.id === selectedBusinessUnit) || 
        businessUnits[0]

    const handleNavigation = (itemId) => {
        if (onNavigate) {
            onNavigate(itemId)
        }
    }

    const handleBusinessUnitChange = (unitId) => {
        setShowBusinessUnits(false)

        if (onBusinessUnitChange) {
            onBusinessUnitChange(unitId)
        }
    }

    return (
        <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>

            <div className="sidebar__header">
                
                <div className="sidebar__brand">

                    <div className="sidebar__logo">
                        <span>TK</span>
                    </div>

                    {!collapsed && (

                        <div className="sidebar__brand-text">
                            <h1>Toko Noni</h1>
                            <span>Store Operations</span>
                        </div>

                    )}

                </div>

                <button
                    type="button"
                    className="sidebar__collapse-button"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <ChevronRight size={18} />
                    ) : (
                        <ChevronRight size={18} />
                    )}
                </button>

            </div>
            
        </aside>


    )
}