import { useMemo, useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Wallet,
} from "lucide-react"

import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"
import SearchInput from "../../components/common/SearchInput"
import StatCard from "../../components/common/StatCard"

import "./cashFlowPage.css"

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

function CashFlowPage({ data = {} }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    summary = {},
    transactions = [],
  } = data

  const {
    balance = null,
    income = null,
    expense = null,
    netCashFlow = null,
  } = summary

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return transactions.filter((transaction) => {
      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter

      const matchesSearch =
        !query ||
        [
          transaction.description,
          transaction.category,
          transaction.account,
          transaction.reference,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      return matchesType && matchesSearch
    })
  }, [transactions, searchTerm, typeFilter])

  return (
    <section className="cash-flow-page">
      <header className="cash-flow-page__header">
        <div>
          <span className="cash-flow-page__eyebrow">Keuangan</span>
          <h1 className="cash-flow-page__title">Kas &amp; Bank</h1>
          <p className="cash-flow-page__description">
            Pantau saldo, pemasukan, dan pengeluaran tokomu.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <span aria-hidden="true">＋</span>
          Catat transaksi
        </Button>
      </header>

      <div className="cash-flow-page__summary">
        <StatCard
          label="Saldo kas & bank"
          value={formatCurrency(balance)}
          detail="Saldo saat ini"
          icon={Wallet}
          tone="purple"
        />
        <StatCard
          label="Kas masuk"
          value={formatCurrency(income)}
          detail="Periode berjalan"
          icon={ArrowDownLeft}
          tone="green"
        />
        <StatCard
          label="Kas keluar"
          value={formatCurrency(expense)}
          detail="Periode berjalan"
          icon={ArrowUpRight}
          tone="orange"
        />
        <StatCard
          label="Arus kas bersih"
          value={formatCurrency(netCashFlow)}
          detail="Pemasukan dikurangi pengeluaran"
          icon={CircleDollarSign}
          tone="blue"
        />
      </div>

      <article className="cash-flow-card">
        <div className="cash-flow-card__header">
          <div>
            <h2>Riwayat transaksi</h2>
            <p>Daftar kas masuk dan kas keluar.</p>
          </div>

          <div className="cash-flow-card__filters">
            <SearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari transaksi..."
              ariaLabel="Cari transaksi kas"
            />

            <label className="cash-flow-select">
              <span className="sr-only">Filter jenis transaksi</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="all">Semua jenis</option>
                <option value="income">Kas masuk</option>
                <option value="expense">Kas keluar</option>
              </select>
            </label>
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="cash-flow-table-wrap">
            <table className="cash-flow-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Deskripsi</th>
                  <th>Kategori</th>
                  <th>Akun</th>
                  <th>Jenis</th>
                  <th className="cash-flow-table__amount-heading">Jumlah</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.date || "—"}</td>
                    <td>
                      <strong>{transaction.description || "Transaksi"}</strong>
                      {transaction.reference && (
                        <span className="cash-flow-table__reference">
                          {transaction.reference}
                        </span>
                      )}
                    </td>
                    <td>{transaction.category || "—"}</td>
                    <td>{transaction.account || "—"}</td>
                    <td>
                      <span
                        className={`cash-flow-type cash-flow-type--${transaction.type}`}
                      >
                        {transaction.type === "income"
                          ? "Kas masuk"
                          : "Kas keluar"}
                      </span>
                    </td>
                    <td
                      className={`cash-flow-table__amount cash-flow-table__amount--${transaction.type}`}
                    >
                      {transaction.type === "expense" ? "−" : "+"}
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cash-flow-empty">
            <div className="cash-flow-empty__icon" aria-hidden="true">
              —
            </div>
            <strong>
              {searchTerm || typeFilter !== "all"
                ? "Transaksi tidak ditemukan"
                : "Belum ada transaksi kas"}
            </strong>
            <span>
              {searchTerm || typeFilter !== "all"
                ? "Ubah kata kunci atau filter, lalu coba lagi."
                : "Transaksi kas dan bank akan muncul di sini."}
            </span>
          </div>
        )}

        <footer className="cash-flow-card__footer">
          Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
        </footer>
      </article>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat transaksi kas"
        size="medium"
      >
        <p className="cash-flow-modal__description">
          Form pencatatan transaksi dapat ditambahkan di bagian ini.
        </p>

        <div className="cash-flow-modal__actions">
          <Button
            variant="secondary"
            onClick={() => setIsModalOpen(false)}
          >
            Batal
          </Button>
          <Button onClick={() => setIsModalOpen(false)}>
            Selesai
          </Button>
        </div>
      </Modal>
    </section>
  )
}

export default CashFlowPage