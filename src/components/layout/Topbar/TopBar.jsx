import { Search, Sun, Moon, ChevronDown } from "lucide-react"
import "./topBar.css"

function TopBar({
  title = "Dashboard",
  subtitle,
  searchValue = "",
  onSearchChange,
  userName = "Admin",
  userRole = "Administrator",
  onProfileClick,
  isDarkMode = false,
  onThemeToggle,
}) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__page-info">
          <h1 className="topbar__title">{title}</h1>
          {subtitle && <p className="topbar__subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="topbar__right">
        <label className="topbar__search">
          <Search size={18} strokeWidth={2} className="topbar__search-icon" aria-hidden="true" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Cari..."
            aria-label="Cari"
          />
        </label>

        <button
          type="button"
          className="topbar__icon-button"
          onClick={onThemeToggle}
          aria-label={isDarkMode ? "Gunakan mode terang" : "Gunakan mode gelap"}
          title={isDarkMode ? "Mode terang" : "Mode gelap"}
        >
          {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button type="button" className="topbar__profile" onClick={onProfileClick}>
          <div className="topbar__avatar" aria-label="Inisial toko TN">TN</div>
          <div className="topbar__profile-info">
            <strong>{userName}</strong>
            <span>{userRole}</span>
          </div>
          <ChevronDown size={16} className="topbar__profile-arrow" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}

export default TopBar
