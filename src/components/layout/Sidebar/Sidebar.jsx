import { useState } from "react"
import {
  LayoutDashboard,
  ShoppingCart,
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
  CircleUserRound,
} from "lucide-react"

import "./sidebar.css"

const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "sales",
    label: "Penjualan",
    icon: ShoppingCart,
  },
  {
    id: "purchases",
    label: "Pembelian",
    icon: ShoppingBag,
  },
  {
    id: "inventory",
    label: "Stok",
    icon: Package,
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
    icon: WalletCards,
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
    name: "Electronic 1",
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
  onCollapsedChange,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [showBusinessUnits, setShowBusinessUnits] = useState(false)

  const currentBusinessUnit =
    businessUnits.find((item) => item.id === selectedBusinessUnit) ||
    businessUnits[0]

  function handleNavigation(itemId) {
    onNavigate?.(itemId)
  }

  function handleBusinessUnitChange(unitId) {
    setShowBusinessUnits(false)
    onBusinessUnitChange?.(unitId)
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
          onClick={() => setCollapsed((current) => {
            const next = !current
            onCollapsedChange?.(next)
            return next
          })}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar__business-unit">
          <span className="sidebar__selection-label">UNIT USAHA</span>

          <button
            type="button"
            className="business-unit-selector"
            onClick={() => setShowBusinessUnits((current) => !current)}
            aria-expanded={showBusinessUnits}
          >
            <div className="business-unit-selector__icon">
              <div className="business-unit-dot" />
            </div>

            <div className="business-unit-selector__content">
              <span>Unit Aktif</span>
              <strong>{currentBusinessUnit.name}</strong>
            </div>

            <ChevronDown
              size={16}
              className={
                showBusinessUnits
                  ? "business-unit-selector__arrow business-unit-selector__arrow--open"
                  : "business-unit-selector__arrow"
              }
            />
          </button>

          {showBusinessUnits && (
            <div className="business-unit-dropdown">
              {businessUnits.map((unit) => (
                <button
                  type="button"
                  key={unit.id}
                  className={`business-unit-option ${
                    selectedBusinessUnit === unit.id
                      ? "business-unit-option-active"
                      : ""
                  }`}
                  onClick={() => handleBusinessUnitChange(unit.id)}
                >
                  <span className="business-unit-option__dot" />
                  <span>{unit.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="sidebar__navigation">
        <span className="sidebar__selection-label">
          {!collapsed && "MENU UTAMA"}
        </span>

        <div className="sidebar__menu">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id

            return (
              <button
                type="button"
                key={item.id}
                className={`sidebar__menu-item ${
                  isActive ? "sidebar__menu-item--active" : ""
                }`}
                onClick={() => handleNavigation(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar__menu-icon">
                  <Icon size={19} strokeWidth={2} />
                </span>

                {!collapsed && (
                  <span className="sidebar__menu-label">{item.label}</span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="sidebar__bottom">
        <div className="sidebar__profile">
          <div className="sidebar-avatar">
            <span>TN</span>
          </div>

          {!collapsed && (
            <>
              <div className="sidebar__profile-info">
                <strong>Admin</strong>
                <span>Supper Summer</span>
              </div>

              <CircleUserRound
                size={18}
                className="sidebar__profile-icon"
              />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar