import "./dashboardPage.css"

function formatCurrency(value) {
    if (value === null || value === undefined) {
        return "—"
    }

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value)
}

function DashboardPage({
    data = {},
    selectedBusinessUnit = "all",
}) {
    const {
        summary = {},
        salesOverview = [],
        cashFlow = [],
        lowStock = [],
        recentTransactions = [],
    } = data

    const {
        sales = null,
        purchases = null,
        cashAndBank = null,
        receivables = null,
    } = summary

    return (
        <section className="dashboard-page">

            {/* ========================================
                PAGE HEADER
            ======================================== */}

            <div className="dashboard-page__header">

                <div>
                    <span className="dashboard-page__eyebrow">
                        Dashboard
                    </span>

                    <h1 className="dashboard-page__title">
                        Ringkasan Operasional
                    </h1>

                    <p className="dashboard-page__description">
                        Pantau penjualan, pembelian, kas, stok,
                        dan piutang dari satu tempat.
                    </p>
                </div>

                <div className="dashboard-page__context">
                    <span>Unit Usaha</span>

                    <strong>
                        {selectedBusinessUnit === "all"
                            ? "Semua Unit Usaha"
                            : selectedBusinessUnit}
                    </strong>
                </div>

            </div>


            {/* ========================================
                KPI
            ======================================== */}

            <div className="dashboard-page__summary">

                <article className="dashboard-card dashboard-card--kpi">
                    <span className="dashboard-card__label">
                        Penjualan
                    </span>

                    <strong className="dashboard-card__value">
                        {formatCurrency(sales)}
                    </strong>

                    <span className="dashboard-card__meta">
                        Periode berjalan
                    </span>
                </article>


                <article className="dashboard-card dashboard-card--kpi">
                    <span className="dashboard-card__label">
                        Pembelian
                    </span>

                    <strong className="dashboard-card__value">
                        {formatCurrency(purchases)}
                    </strong>

                    <span className="dashboard-card__meta">
                        Periode berjalan
                    </span>
                </article>


                <article className="dashboard-card dashboard-card--kpi">
                    <span className="dashboard-card__label">
                        Kas & Bank
                    </span>

                    <strong className="dashboard-card__value">
                        {formatCurrency(cashAndBank)}
                    </strong>

                    <span className="dashboard-card__meta">
                        Saldo saat ini
                    </span>
                </article>


                <article className="dashboard-card dashboard-card--kpi">
                    <span className="dashboard-card__label">
                        Piutang
                    </span>

                    <strong className="dashboard-card__value">
                        {formatCurrency(receivables)}
                    </strong>

                    <span className="dashboard-card__meta">
                        Belum tertagih
                    </span>
                </article>

            </div>


            {/* ========================================
                MAIN GRID
            ======================================== */}

            <div className="dashboard-page__grid">

                {/* SALES */}
                <article className="dashboard-card dashboard-card--large">

                    <div className="dashboard-card__header">

                        <div>
                            <h2>
                                Penjualan
                            </h2>

                            <p>
                                Performa penjualan berdasarkan periode.
                            </p>
                        </div>

                    </div>

                    {salesOverview.length > 0 ? (
                        <div className="dashboard-data-list">

                            {salesOverview.map((item) => (
                                <div
                                    className="dashboard-data-row"
                                    key={item.id}
                                >
                                    <span>
                                        {item.label}
                                    </span>

                                    <strong>
                                        {formatCurrency(item.value)}
                                    </strong>
                                </div>
                            ))}

                        </div>
                    ) : (
                        <DashboardEmptyState
                            title="Belum ada data penjualan"
                            description="Data penjualan akan muncul setelah transaksi tersedia."
                        />
                    )}

                </article>


                {/* CASH FLOW */}
                <article className="dashboard-card">

                    <div className="dashboard-card__header">

                        <div>
                            <h2>
                                Arus Kas
                            </h2>

                            <p>
                                Kas masuk dan keluar.
                            </p>
                        </div>

                    </div>

                    {cashFlow.length > 0 ? (
                        <div className="dashboard-data-list">

                            {cashFlow.map((item) => (
                                <div
                                    className="dashboard-data-row"
                                    key={item.id}
                                >
                                    <span>
                                        {item.label}
                                    </span>

                                    <strong>
                                        {formatCurrency(item.value)}
                                    </strong>
                                </div>
                            ))}

                        </div>
                    ) : (
                        <DashboardEmptyState
                            title="Belum ada transaksi kas"
                            description="Arus kas akan muncul setelah transaksi keuangan tersedia."
                        />
                    )}

                </article>


                {/* LOW STOCK */}
                <article className="dashboard-card">

                    <div className="dashboard-card__header">

                        <div>
                            <h2>
                                Stok Perlu Perhatian
                            </h2>

                            <p>
                                Produk dengan stok rendah.
                            </p>
                        </div>

                    </div>

                    {lowStock.length > 0 ? (
                        <div className="dashboard-data-list">

                            {lowStock.map((item) => (
                                <div
                                    className="dashboard-data-row"
                                    key={item.id}
                                >
                                    <div>
                                        <strong>
                                            {item.name}
                                        </strong>

                                        <span>
                                            Stok: {item.stock}
                                        </span>
                                    </div>

                                    <span className="dashboard-status dashboard-status--warning">
                                        Rendah
                                    </span>
                                </div>
                            ))}

                        </div>
                    ) : (
                        <DashboardEmptyState
                            title="Tidak ada stok rendah"
                            description="Produk yang membutuhkan perhatian akan muncul di sini."
                        />
                    )}

                </article>


                {/* RECENT TRANSACTIONS */}
                <article className="dashboard-card dashboard-card--large">

                    <div className="dashboard-card__header">

                        <div>
                            <h2>
                                Transaksi Terbaru
                            </h2>

                            <p>
                                Aktivitas transaksi terakhir.
                            </p>
                        </div>

                    </div>

                    {recentTransactions.length > 0 ? (
                        <div className="dashboard-data-list">

                            {recentTransactions.map((transaction) => (
                                <div
                                    className="dashboard-data-row"
                                    key={transaction.id}
                                >
                                    <div>
                                        <strong>
                                            {transaction.description}
                                        </strong>

                                        <span>
                                            {transaction.type}
                                        </span>
                                    </div>

                                    <strong>
                                        {formatCurrency(transaction.amount)}
                                    </strong>
                                </div>
                            ))}

                        </div>
                    ) : (
                        <DashboardEmptyState
                            title="Belum ada transaksi"
                            description="Transaksi terbaru akan muncul setelah aktivitas tersedia."
                        />
                    )}

                </article>

            </div>

        </section>
    )
}


/* ========================================
   EMPTY STATE
======================================== */

function DashboardEmptyState({
    title,
    description,
}) {
    return (
        <div className="dashboard-empty">

            <div className="dashboard-empty__icon">
                —
            </div>

            <strong>
                {title}
            </strong>

            <span>
                {description}
            </span>

        </div>
    )
}


export default DashboardPage