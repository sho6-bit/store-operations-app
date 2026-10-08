import {
  CircleDollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react"

import StatCard from "../../components/common/StatCard"
import "./dashboardPage.css"

function formatCurrency(value) {
  if (value === null || value === undefined) return "—"

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
      <header className="dashboard-page__header">
        <div>
          <span className="dashboard-page__eyebrow">Dashboard</span>
          <h1 className="dashboard-page__title">Ringkasan Operasional</h1>
          <p className="dashboard-page__description">
            Pantau penjualan, pembelian, kas, stok, dan piutang.
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
      </header>

      <div className="dashboard-page__summary">
        <StatCard
          label="Penjualan"
          value={formatCurrency(sales)}
          detail="Periode berjalan"
          icon={ShoppingCart}
          tone="purple"
        />
        <StatCard
          label="Pembelian"
          value={formatCurrency(purchases)}
          detail="Periode berjalan"
          icon={Package}
          tone="orange"
        />
        <StatCard
          label="Kas & Bank"
          value={formatCurrency(cashAndBank)}
          detail="Saldo saat ini"
          icon={CircleDollarSign}
          tone="green"
        />
        <StatCard
          label="Piutang"
          value={formatCurrency(receivables)}
          detail="Belum tertagih"
          icon={Users}
          tone="blue"
        />
      </div>

      <div className="dashboard-page__grid">
        <DashboardList
          title="Penjualan"
          description="Performa penjualan berdasarkan periode."
          items={salesOverview}
          emptyMessage="Belum ada data penjualan."
          renderItem={(item) => (
            <>
              <span>{item.label}</span>
              <strong>{formatCurrency(item.value)}</strong>
            </>
          )}
        />

        <DashboardList
          title="Arus Kas"
          description="Kas masuk dan keluar."
          items={cashFlow}
          emptyMessage="Belum ada transaksi kas."
          renderItem={(item) => (
            <>
              <span>{item.label}</span>
              <strong>{formatCurrency(item.value)}</strong>
            </>
          )}
        />

        <DashboardList
          title="Stok Perlu Perhatian"
          description="Produk dengan stok rendah."
          items={lowStock}
          emptyMessage="Belum ada data stok rendah."
          renderItem={(item) => (
            <div className="dashboard-data-row__details">
              <strong>{item.name}</strong>
              <span>Stok: {item.stock}</span>
            </div>
          )}
        />

        <DashboardList
          title="Transaksi Terbaru"
          description="Aktivitas transaksi terakhir."
          items={recentTransactions}
          emptyMessage="Belum ada transaksi."
          large
          renderItem={(transaction) => (
            <>
              <div className="dashboard-data-row__details">
                <strong>{transaction.description}</strong>
                <span>{transaction.type}</span>
              </div>
              <strong>{formatCurrency(transaction.amount)}</strong>
            </>
          )}
        />
      </div>
    </section>
  )
}

function DashboardList({
  title,
  description,
  items,
  emptyMessage,
  renderItem,
  large = false,
}) {
  return (
    <article
      className={`dashboard-card${large ? " dashboard-card--large" : ""}`}
    >
      <div className="dashboard-card__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="dashboard-data-list">
          {items.map((item) => (
            <div className="dashboard-data-row" key={item.id}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty">
          <strong>{emptyMessage}</strong>
        </div>
      )}
    </article>
  )
}

export default DashboardPage