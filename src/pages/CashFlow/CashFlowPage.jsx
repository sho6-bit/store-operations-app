import { useEffect, useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, History, Landmark, Plus, Wallet } from "lucide-react"
import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"
import SearchInput from "../../components/common/SearchInput"
import "./cashFlowPage.css"

const defaultBusinessUnits = [
  { id: "furniture", name: "Furniture" },
  { id: "electronic-1", name: "Electronic 1" },
  { id: "electronic-2", name: "Electronic 2" },
]

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "—"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function CashFlowPage({ data = {}, onCreateCashEntry, businessUnits = defaultBusinessUnits, globalSearchValue = "" }) {
  const [searchTerm, setSearchTerm] = useState("")
  useEffect(() => { setSearchTerm(globalSearchValue) }, [globalSearchValue])
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedAccount, setSelectedAccount] = useState(null)
  const summary = data?.summary ?? {}
  const transactions = Array.isArray(data?.transactions) ? data.transactions : []
  const accounts = Array.isArray(data?.accounts) ? data.accounts : []

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return transactions.filter((transaction) => {
      const matchesType = typeFilter === "all" || transaction.type === typeFilter
      const matchesSearch = !query || [transaction.description, transaction.category, transaction.account, transaction.reference]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
      return matchesType && matchesSearch
    })
  }, [transactions, searchTerm, typeFilter])

  const accountMovements = useMemo(() => {
    if (!selectedAccount) return []
    return transactions
      .filter((transaction) => transaction.businessUnit === selectedAccount.businessUnit && transaction.accountType === selectedAccount.type)
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
  }, [transactions, selectedAccount])

  function getAccount(unitId, accountType) {
    return accounts.find((account) =>
      (account.businessUnit === unitId || account.businessUnitId === unitId) && account.type === accountType
    )
  }

  return (
    <section className="cash-flow-page">
      <header className="cash-flow-page__header">
        <div>
          <span className="cash-flow-page__eyebrow">KEUANGAN</span>
          <h1 className="cash-flow-page__title">Kas &amp; Bank</h1>
          <p className="cash-flow-page__description">Ringkasan saldo dan pergerakan dana seluruh unit usaha.</p>
        </div>
        <Button onClick={onCreateCashEntry}><Plus size={16} />Tambah Kas</Button>
      </header>

      <section className="cash-flow-total" aria-label="Ringkasan saldo kas dan bank">
        <div>
          <span className="cash-flow-total__label">Mutasi bersih seluruh akun</span>
          <strong className="cash-flow-total__value">{formatCurrency(summary.balance)}</strong>
          <span className="cash-flow-total__caption">{summary.asOf ? "Per " + summary.asOf : "Nilai dihitung dari kas masuk dikurangi kas keluar yang dicatat"}</span>
        </div>
      </section>

      <section className="cash-flow-accounts" aria-label="Saldo akun per unit usaha">
        {businessUnits.map((unit) => (
          <div className="cash-flow-account-column" key={unit.id}>
            {[
              { type: "cash", label: "Kas", icon: Wallet },
              { type: "bank", label: "Bank", icon: Landmark },
            ].map((kind) => {
              const account = getAccount(unit.id, kind.type)
              const Icon = kind.icon
              const accountName = account?.name || kind.label + " " + unit.name
              return (
                <article className="cash-account-card" key={unit.id + "-" + kind.type}>
                  <div className="cash-account-card__top">
                    <span className={"cash-account-card__icon cash-account-card__icon--" + kind.type}><Icon size={19} aria-hidden="true" /></span>
                    <span className="cash-account-card__unit">{unit.name}</span>
                  </div>
                  <span className="cash-account-card__name">{accountName}</span>
                  <strong className="cash-account-card__balance" aria-label="Mutasi bersih akun">{formatCurrency(account?.balance)}</strong>
                  <div className="cash-account-card__movement">
                    <div><span><ArrowDownLeft size={14} /> Masuk hari ini</span><strong className="is-positive">{formatCurrency(account?.todayIncome)}</strong></div>
                    <div><span><ArrowUpRight size={14} /> Keluar hari ini</span><strong className="is-negative">{formatCurrency(account?.todayExpense)}</strong></div>
                  </div>
                  <button type="button" className="cash-account-card__history" onClick={() => setSelectedAccount({ businessUnit: unit.id, unitName: unit.name, type: kind.type, name: accountName })}>
                    <History size={14} /> Lihat mutasi
                  </button>
                </article>
              )
            })}
          </div>
        ))}
      </section>

      <article className="cash-flow-card">
        <div className="cash-flow-card__header">
          <div><h2>Mutasi kas dan bank</h2><p>Catatan pergerakan dana dari seluruh unit usaha.</p></div>
          <div className="cash-flow-card__filters">
            <SearchInput value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari transaksi..." ariaLabel="Cari transaksi kas dan bank" />
            <label className="cash-flow-select"><span className="sr-only">Filter jenis transaksi</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Semua jenis</option><option value="income">Kas masuk</option><option value="expense">Kas keluar</option></select></label>
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="cash-flow-table-wrap">
            <table className="cash-flow-table">
              <thead><tr><th>Tanggal</th><th>Deskripsi</th><th>Unit Usaha</th><th>Akun</th><th>Jenis</th><th className="cash-flow-table__amount-heading">Jumlah</th></tr></thead>
              <tbody>{filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.date || "—"}</td>
                  <td><strong>{transaction.description || "—"}</strong>{transaction.reference && <span className="cash-flow-table__reference">{transaction.reference}</span>}</td>
                  <td>{businessUnits.find((unit) => unit.id === transaction.businessUnit)?.name || transaction.businessUnit || "—"}</td>
                  <td>{transaction.account || "—"}</td>
                  <td>{transaction.type === "income" ? "Kas masuk" : transaction.type === "expense" ? "Kas keluar" : "—"}</td>
                  <td className={"cash-flow-table__amount cash-flow-table__amount--" + (transaction.type || "")}>{formatCurrency(transaction.amount)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="cash-flow-empty"><strong>{searchTerm || typeFilter !== "all" ? "Transaksi tidak ditemukan" : "Belum ada mutasi kas dan bank"}</strong><span>{searchTerm || typeFilter !== "all" ? "Ubah kata kunci atau filter, lalu coba lagi." : "Mutasi akan tampil di sini setelah data tersedia."}</span></div>
        )}
        <footer className="cash-flow-card__footer">Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi</footer>
      </article>

      <Modal isOpen={Boolean(selectedAccount)} onClose={() => setSelectedAccount(null)} title={selectedAccount ? `Mutasi ${selectedAccount.name}` : "Mutasi akun"} size="large">
        {selectedAccount && <div className="cash-account-history">
          <p className="cash-account-history__subtitle">{selectedAccount.unitName} · {accountMovements.length} mutasi</p>
          {accountMovements.length ? (
            <div className="cash-account-history__table-wrap"><table className="cash-account-history__table">
              <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Jenis</th><th className="is-numeric">Jumlah</th></tr></thead>
              <tbody>{accountMovements.map((movement) => <tr key={movement.id}>
                <td>{movement.date || "—"}</td><td><strong>{movement.description || "—"}</strong>{movement.reference && <small>{movement.reference}</small>}</td>
                <td>{movement.type === "income" ? "Kas masuk" : movement.type === "expense" ? "Kas keluar" : "—"}</td>
                <td className={"is-numeric " + (movement.type === "income" ? "is-positive" : "is-negative")}>{formatCurrency(movement.amount)}</td>
              </tr>)}</tbody>
            </table></div>
          ) : <div className="cash-flow-empty"><strong>Belum ada mutasi pada akun ini</strong><span>Mutasi akan tampil setelah transaksi kas atau bank tercatat.</span></div>}
        </div>}
      </Modal>
    </section>
  )
}

export default CashFlowPage
