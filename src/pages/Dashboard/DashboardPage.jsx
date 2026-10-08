import { useMemo, useState } from "react"
import { CircleDollarSign, Package, ShoppingCart, Users } from "lucide-react"

import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"
import SearchInput from "../../components/common/SearchInput"
import StatCard from "../../components/common/StatCard"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) return recentTransactions

    return recentTransactions.filter((transaction) =>
      [transaction.description, transaction.type, transaction.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [recentTransactions, searchTerm])

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <span className="dashboard-page__eyebrow">Dashboard</span>
          <h1 className="dashboard-page__title">Ringkasan Operasional</h1>
          <p className="dashboard-page__description">
            Pantau penjualan, pembelian, kas, stok, dan piutang dari satu tempat.
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
        <article className="dashboard-card dashboard-card--large">
          <div className="dashboard-card__header">
            <div>
              <h2>Penjualan</h2>
              <p>Performa penjualan berdasarkan periode.</p>
            </div>
          </div>

          {salesOverview.length > 0 ? (
            <div className="dashboard-data-list">
              {salesOverview.map((item) => (
                <div className="dashboard-data-row" key={item.id}>
                  <span>{item.label}</span>
                  <strong>{formatCurrency(item.value)}</strong>
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

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <div>
              <h2>Arus Kas</h2>
              <p>Kas masuk dan keluar.</p>
            </div>
          </div>

          {cashFlow.length > 0 ? (
            <div className="dashboard-data-list">
              {cashFlow.map((item) => (
                <div className="dashboard-data-row" key={item.id}>
                  <span>{item.label}</span>
                  <strong>{formatCurrency(item.value)}</strong>
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

        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <div>
              <h2>Stok Perlu Perhatian</h2>
              <p>Produk dengan stok rendah.</p>
            </div>
          </div>

          {lowStock.length > 0 ? (
            <div className="dashboard-data-list">
              {lowStock.map((item) => (
                <div className="dashboard-data-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>Stok: {item.stock}</span>
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

        <article className="dashboard-card dashboard-card--large">
          <div className="dashboard-card__header dashboard-card__header--actions">
            <div>
              <h2>Transaksi Terbaru</h2>
              <p>Aktivitas transaksi terakhir.</p>
            </div>

            <div className="dashboard-page__actions">
              <SearchInput
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari transaksi..."
                ariaLabel="Cari transaksi"
              />
              <Button onClick={() => setIsModalOpen(true)}>
                Tambah transaksi
              </Button>
            </div>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="dashboard-data-list">
              {filteredTransactions.map((transaction) => (
                <div className="dashboard-data-row" key={transaction.id}>
                  <div>
                    <strong>{transaction.description}</strong>
                    <span>{transaction.type}</span>
                  </div>
                  <strong>{formatCurrency(transaction.amount)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title={
                searchTerm
                  ? "Transaksi tidak ditemukan"
                  : "Belum ada transaksi"
              }
              description={
                searchTerm
                  ? "Coba kata kunci pencarian lain."
                  : "Transaksi terbaru akan muncul setelah aktivitas tersedia."
              }
            />
          )}
        </article>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah transaksi"
        size="small"
      >
        <p>Form transaksi bisa ditambahkan di bagian ini.</p>
        <div className="dashboard-page__modal-actions">
          <Button
            variant="secondary"
            onClick={() => setIsModalOpen(false)}
          >
            Tutup
          </Button>
        </div>
      </Modal>
    </section>
  )
}

function DashboardEmptyState({ title, description }) {
  return (
    <div className="dashboard-empty">
      <div className="dashboard-empty__icon" aria-hidden="true">
        —
      </div>
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  )
}

export default DashboardPage