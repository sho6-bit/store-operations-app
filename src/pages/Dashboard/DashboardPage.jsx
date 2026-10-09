import {
  Package,
  Plus,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react"

import Button from "../../components/common/Button"
import StatCard from "../../components/common/StatCard"
import "./dashboardPage.css"

const unitNames = {
  all: "Semua Unit Usaha",
  furniture: "Furniture",
  "electronic-1": "Electronic 1",
  "electronic-2": "Electronic 2",
}

function formatCurrency(value) {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function DashboardPage({ data, selectedBusinessUnit, onCreateTransaction }) {
  const summary = data?.summary ?? {}
  const salesOverview = Array.isArray(data?.salesOverview) ? data.salesOverview : []
  const salesByUnit = Array.isArray(data?.salesByUnit) ? data.salesByUnit : []
  const cashFlow = Array.isArray(data?.cashFlow) ? data.cashFlow : []
  const lowStock = Array.isArray(data?.lowStock) ? data.lowStock : []
  const recentTransactions = Array.isArray(data?.recentTransactions)
    ? data.recentTransactions
    : []

  const unitTotal = salesByUnit.reduce((total, unit) => total + (Number(unit.value) || 0), 0)

  return (
    <section className="dashboard-page">
      <header className="dashboard-page__welcome">
        <div>
          <span className="dashboard-page__eyebrow">RINGKASAN TOKO</span>
          <h2 className="dashboard-page__greeting">Ringkasan operasional</h2>
          <p className="dashboard-page__description">
            Pantau kinerja toko dari data yang tersedia.
          </p>
        </div>
        <div className="dashboard-page__welcome-actions">
          <div className="dashboard-page__unit">
            <span>UNIT USAHA</span>
            <strong>{unitNames[selectedBusinessUnit] || selectedBusinessUnit || "—"}</strong>
          </div>
          <Button onClick={onCreateTransaction}><Plus size={16} />Buat Transaksi</Button>
        </div>
      </header>

      <section className="dashboard-page__summary" aria-label="Ringkasan utama">
        <StatCard label="Total Penjualan" value={formatCurrency(summary.sales)} icon={ShoppingCart} tone="blue" />
        <StatCard label="Total Pembelian" value={formatCurrency(summary.purchases)} icon={Package} tone="purple" />
        <StatCard label="Arus Kas Bersih" value={formatCurrency(summary.cashAndBank)} icon={Wallet} tone="green" />
        <StatCard label="Piutang" value={formatCurrency(summary.receivables)} icon={Users} tone="orange" />
      </section>

      <section className="dashboard-page__charts" aria-label="Grafik laporan">
        <article className="dashboard-panel dashboard-panel--sales">
          <header className="dashboard-panel__header">
            <div>
              <h3>Tren Penjualan</h3>
              <p>Performa penjualan per periode</p>
            </div>
          </header>

          {salesOverview.length > 0 ? (
            <div className="sales-chart" role="img" aria-label="Grafik tren penjualan">
              <div className="sales-chart__axis">
                {["100%", "75%", "50%", "25%", "0%"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="sales-chart__plot">
                <div className="sales-chart__grid">
                  <i /><i /><i /><i /><i />
                </div>
                <div className="sales-chart__bars">
                  {salesOverview.map((item) => {
                    const maxValue = Math.max(...salesOverview.map((entry) => Number(entry.value) || 0), 1)
                    const height = Math.max(((Number(item.value) || 0) / maxValue) * 100, 2)
                    return (
                      <div className="sales-chart__item" key={item.id}>
                        <div className="sales-chart__bar-wrap">
                          <div className="sales-chart__bar" style={{ height: `${height}%` }} title={formatCurrency(item.value)} />
                        </div>
                        <span>{item.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <DashboardEmpty message="Data penjualan belum tersedia untuk ditampilkan." />
          )}
        </article>

        <article className="dashboard-panel dashboard-panel--units">
          <header className="dashboard-panel__header">
            <div>
              <h3>Penjualan per Unit</h3>
              <p>Distribusi berdasarkan unit usaha</p>
            </div>
          </header>

          {salesByUnit.length > 0 && unitTotal > 0 ? (
            <>
              <div
                className="unit-chart"
                style={{
                  background: `conic-gradient(${salesByUnit.reduce((state, unit, index) => {
                    const start = state.offset
                    const end = start + ((Number(unit.value) || 0) / unitTotal) * 100
                    state.parts.push(`var(--unit-color-${index % 5}) ${start}% ${end}%`)
                    state.offset = end
                    return state
                  }, { parts: [], offset: 0 }).parts.join(", ")})`,
                }}
                role="img"
                aria-label="Diagram distribusi penjualan per unit"
              >
                <div className="unit-chart__center">
                  <strong>{formatCurrency(unitTotal)}</strong>
                  <span>Total</span>
                </div>
              </div>
              <ul className="unit-legend">
                {salesByUnit.map((unit, index) => (
                  <li key={unit.id}>
                    <span className="unit-legend__name">
                      <i style={{ background: `var(--unit-color-${index % 5})` }} />
                      {unit.label}
                    </span>
                    <strong>{unitTotal ? Math.round((Number(unit.value) / unitTotal) * 100) : 0}%</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <DashboardEmpty message="Data penjualan per unit belum tersedia." />
          )}
        </article>
      </section>

      <section className="dashboard-page__lower-grid">
        <DashboardList
          title="Arus Kas"
          description="Kas masuk dan keluar"
          items={cashFlow}
          renderItem={(item) => (
            <>
              <span className="dashboard-data-row__main">
                {item.label || item.description || "—"}
              </span>
              <strong className={item.type === "income" ? "is-positive" : item.type === "expense" ? "is-negative" : ""}>
                {formatCurrency(item.value ?? item.amount)}
              </strong>
            </>
          )}
          emptyMessage="Data arus kas belum tersedia."
        />

        <DashboardList
          title="Stok Perlu Perhatian"
          description="Produk dengan stok rendah"
          items={lowStock}
          renderItem={(item) => (
            <>
              <span className="dashboard-data-row__main">{item.name || "—"}</span>
              <strong>{item.stock ?? "—"}{item.unit ? ` ${item.unit}` : ""}</strong>
            </>
          )}
          emptyMessage="Data stok rendah belum tersedia."
        />
      </section>

      <article className="dashboard-panel dashboard-transactions">
        <header className="dashboard-panel__header">
          <div>
            <h3>Transaksi Terbaru</h3>
            <p>Aktivitas terbaru berdasarkan data transaksi</p>
          </div>
        </header>

        {recentTransactions.length > 0 ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Referensi</th>
                  <th>Pelanggan / Supplier</th>
                  <th>Unit Usaha</th>
                  <th>Jenis</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.reference || item.number || "—"}</strong>
                      {item.date && <span>{item.date}</span>}
                    </td>
                    <td>{item.customer || item.supplier || item.description || "—"}</td>
                    <td>{unitNames[item.businessUnit] || item.businessUnit || "—"}</td>
                    <td>{item.type || "—"}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td>{item.status || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <DashboardEmpty message="Data transaksi terbaru belum tersedia." />
        )}
      </article>
    </section>
  )
}

function DashboardEmpty({ message }) {
  return <div className="dashboard-empty">{message}</div>
}

function DashboardList({ title, description, items, renderItem, emptyMessage }) {
  return (
    <article className="dashboard-panel">
      <header className="dashboard-panel__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </header>
      {items.length > 0 ? (
        <div className="dashboard-data-list">
          {items.map((item) => (
            <div className="dashboard-data-row" key={item.id}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <DashboardEmpty message={emptyMessage} />
      )}
    </article>
  )
}

export default DashboardPage
