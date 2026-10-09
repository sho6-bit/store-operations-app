import { useEffect, useRef, useState } from "react"
import { Search, Sun, Moon, ChevronDown, X, Settings, LogOut } from "lucide-react"
import "./topBar.css"

function TopBar({
  title = "Dashboard",
  subtitle,
  searchValue = "",
  onSearchChange,
  searchResults = [],
  onSearchResultSelect,
  userName = "Admin",
  userRole = "Administrator",
  onProfileClick,
  onNavigate,
  isDarkMode = false,
  onThemeToggle,
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    function handlePointerDown(event) {
      if (!profileMenuRef.current?.contains(event.target)) setIsProfileMenuOpen(false)
    }
    function handleEscape(event) {
      if (event.key === "Escape") setIsProfileMenuOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  function handleKeyDown(event) {
    if (event.key === "Escape") setIsSearchOpen(false)
    if (event.key === "Enter" && searchResults.length > 0) {
      event.preventDefault()
      onSearchResultSelect?.(searchResults[0])
      setIsSearchOpen(false)
    }
  }

  function selectResult(result) {
    onSearchResultSelect?.(result)
    setIsSearchOpen(false)
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__page-info">
          <h1 className="topbar__title">{title}</h1>
          {subtitle && <p className="topbar__subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="topbar__right">
        <div className="topbar__search-container">
          <label className="topbar__search">
            <Search size={18} strokeWidth={2} className="topbar__search-icon" aria-hidden="true" />
            <input
              type="search"
              value={searchValue}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(event) => { onSearchChange?.(event.target.value); setIsSearchOpen(true) }}
              onKeyDown={handleKeyDown}
              placeholder="Cari produk, invoice, pelanggan..."
              aria-label="Cari produk, transaksi, pelanggan, supplier, dan mutasi kas"
              aria-autocomplete="list"
              aria-expanded={isSearchOpen && Boolean(searchValue.trim())}
            />
            {searchValue && <button className="topbar__search-clear" type="button" onClick={() => { onSearchChange?.(""); setIsSearchOpen(false) }} aria-label="Hapus pencarian"><X size={15} /></button>}
          </label>
          {isSearchOpen && searchValue.trim() && (
            <div className="topbar-search-results" role="listbox" aria-label="Hasil pencarian global">
              {searchResults.length > 0 ? searchResults.map((result) => (
                <button className="topbar-search-result" type="button" role="option" aria-selected="false" key={result.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectResult(result)}>
                  <span className="topbar-search-result__type">{result.type}</span>
                  <strong>{result.title}</strong>
                  <small>{result.subtitle}</small>
                </button>
              )) : <p className="topbar-search-results__empty">Tidak ada hasil yang cocok.</p>}
              {searchResults.length > 0 && <span className="topbar-search-results__hint">Enter membuka hasil pertama · Esc menutup</span>}
            </div>
          )}
        </div>

        <button type="button" className="topbar__icon-button" onClick={onThemeToggle} aria-label={isDarkMode ? "Gunakan mode terang" : "Gunakan mode gelap"} title={isDarkMode ? "Mode terang" : "Mode gelap"}>
          {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <div className="topbar__profile-menu" ref={profileMenuRef}>
          <button
            type="button"
            className="topbar__profile"
            onClick={() => { onProfileClick?.(); setIsProfileMenuOpen((open) => !open) }}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            aria-label="Buka menu akun Admin"
          >
            <div className="topbar__avatar" aria-hidden="true">TN</div>
            <div className="topbar__profile-info"><strong>{userName}</strong><span>{userRole}</span></div>
            <ChevronDown size={16} className="topbar__profile-arrow" aria-hidden="true" />
          </button>
          {isProfileMenuOpen && (
            <div className="topbar-profile-dropdown" role="menu" aria-label="Menu akun">
              <div className="topbar-profile-dropdown__identity">
                <span className="topbar__avatar" aria-hidden="true">TN</span>
                <span><strong>{userName}</strong><small>{userRole}</small></span>
              </div>
              <button type="button" role="menuitem" onClick={() => { setIsProfileMenuOpen(false); onNavigate?.("settings") }}>
                <Settings size={16} aria-hidden="true" /> Pengaturan
              </button>
              <div className="topbar-profile-dropdown__unavailable" title="Sistem login belum tersedia">
                <LogOut size={16} aria-hidden="true" />
                <span><strong>Keluar</strong><small>Perlu sistem login</small></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar
