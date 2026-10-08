import {
    Search,
    Bell,
    Sun,
    Moon,
    ChevronDown,
} from "lucide-react"

import "./topBar.css"

function TopBar({
    title = "Dashboard",
    subtitle = "Ringkasan operasional toko",

    searchValue = "",
    onSearchChange,

    notificationCount = 0,
    onNotificationClick,

    userName = "Admin",
    userRole = "Administrator",
    userInitials = "TN",
    onProfileClick,

    isDarkMode = false,
    onThemeToggle,
}) {
    return (
        <header className="topbar">

            {/* LEFT */}
            <div className="topbar__left">

                <div className="topbar__page-info">
                    <h1 className="topbar__title">
                        {title}
                    </h1>

                    {subtitle && (
                        <p className="topbar__subtitle">
                            {subtitle}
                        </p>
                    )}
                </div>

            </div>


            {/* RIGHT */}
            <div className="topbar__right">

                {/* SEARCH */}
                <div className="topbar__search">

                    <Search
                        size={18}
                        strokeWidth={2}
                        className="topbar__search-icon"
                    />

                    <input
                        type="search"
                        value={searchValue}
                        onChange={(event) => {
                            if (onSearchChange) {
                                onSearchChange(event.target.value)
                            }
                        }}
                        placeholder="Cari..."
                        aria-label="Cari"
                    />

                </div>


                {/* THEME */}
                <button
                    type="button"
                    className="topbar__icon-button"
                    onClick={onThemeToggle}
                    aria-label={
                        isDarkMode
                            ? "Gunakan mode terang"
                            : "Gunakan mode gelap"
                    }
                    title={
                        isDarkMode
                            ? "Mode terang"
                            : "Mode gelap"
                    }
                >
                    {isDarkMode ? (
                        <Sun size={19} />
                    ) : (
                        <Moon size={19} />
                    )}
                </button>


                {/* NOTIFICATION */}
                <button
                    type="button"
                    className="topbar__notification"
                    onClick={onNotificationClick}
                    aria-label="Notifikasi"
                >
                    <Bell
                        size={20}
                        strokeWidth={2}
                    />

                    {notificationCount > 0 && (
                        <span className="topbar__notification-badge">
                            {notificationCount > 99
                                ? "99+"
                                : notificationCount}
                        </span>
                    )}
                </button>


                {/* PROFILE */}
                <button
                    type="button"
                    className="topbar__profile"
                    onClick={onProfileClick}
                >

                    <div className="topbar__avatar">
                        {userInitials}
                    </div>

                    <div className="topbar__profile-info">
                        <strong>
                            {userName}
                        </strong>

                        <span>
                            {userRole}
                        </span>
                    </div>

                    <ChevronDown
                        size={16}
                        className="topbar__profile-arrow"
                    />

                </button>

            </div>

        </header>
    )
}

export default TopBar