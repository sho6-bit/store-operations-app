import { useEffect, useMemo, useState } from "react"

import "./appLayout.css"
import Sidebar from "./Sidebar/Sidebar.jsx"
import TopBar from "./Topbar/TopBar.jsx"
import CashFlowPage from "../../pages/CashFlow/CashFlowPage.jsx"
import CustomersPage from "../../pages/Customers/CustomersPage.jsx"
import DashboardPage from "../../pages/Dashboard/DashboardPage.jsx"
import InventoryPage from "../../pages/Inventory/InventoryPage.jsx"
import PurchasesPage from "../../pages/Purchases/PurchasesPage.jsx"
import ReportsPage from "../../pages/Reports/ReportsPage.jsx"
import SalesPage from "../../pages/Sales/SalesPage.jsx"
import SettingPage from "../../pages/Settings/SettingsPage.jsx"
import SuppliersPage from "../../pages/Suppliers/SuppliersPage.jsx"
import TransactionFormModal from "../forms/TransactionFormModal.jsx"
import CashEntryModal from "../forms/CashEntryModal.jsx"
import { createId, readStoreData, writeStoreData } from "../../services/dataProvider.js"

const pageTitles = {
  dashboard: "Dashboard", sales: "Penjualan", purchases: "Pembelian", inventory: "Stok",
  customers: "Customer", suppliers: "Supplier", cash: "Kas & Bank", reports: "Laporan", settings: "Pengaturan",
}

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0)
}

function AppLayout() {
  const [activeItem, setActiveItem] = useState("dashboard")
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState("all")
  const [searchValue, setSearchValue] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [store, setStore] = useState(readStoreData)
  const [transactionDraft, setTransactionDraft] = useState(null)
  const [isCashModalOpen, setIsCashModalOpen] = useState(false)

  useEffect(() => { writeStoreData(store) }, [store])

  function addParty(kind, party) {
    const id = createId()
    const record = { ...party, id }
    setStore((current) => ({ ...current, [kind]: [...current[kind], record] }))
    return record
  }

  function saveCustomer(customer) { addParty("customers", customer) }
  function updateCustomer(id, customer) {
    setStore((current) => ({ ...current, customers: current.customers.map((item) => item.id === id ? { ...item, ...customer } : item) }))
  }
  function deleteCustomer(id) {
    setStore((current) => ({ ...current, customers: current.customers.filter((item) => item.id !== id) }))
  }
  function saveSupplier(supplier) { addParty("suppliers", supplier) }

  function saveProduct(product) {
    const duplicate = store.products.some((item) => item.sku?.toLowerCase() === product.sku?.toLowerCase() && item.id !== product.id)
    if (duplicate) throw new Error("SKU sudah digunakan. Gunakan SKU yang berbeda.")
    setStore((current) => {
      if (product.id && current.products.some((item) => item.id === product.id)) {
        return { ...current, products: current.products.map((item) => item.id === product.id ? { ...item, ...product } : item) }
      }
      return { ...current, products: [...current.products, { ...product, id: createId(), stock: product.stock ?? 0 }] }
    })
  }

  function saveTransaction(payload, existingTransaction = null) {
    const collection = payload.type === "sale" ? "sales" : "purchases"
    const duplicate = store[collection].some((item) =>
      item.id !== existingTransaction?.id && String(item.number).toLowerCase() === payload.invoiceNumber.toLowerCase(),
    )
    if (duplicate) throw new Error("Nomor invoice tersebut sudah digunakan pada transaksi sejenis.")

    const newSkus = payload.items.filter((item) => !item.product.id).map((item) => item.product.sku.toLowerCase())
    if (newSkus.some((sku) => store.products.some((product) => product.sku?.toLowerCase() === sku))) {
      throw new Error("Salah satu SKU produk baru sudah terdaftar. Pilih produk yang tersedia.")
    }
    const partyCollection = payload.type === "sale" ? "customers" : "suppliers"
    const party = payload.party.id ? payload.party : { ...payload.party, id: createId() }
    const lineItems = payload.items.map((item) => {
      const product = item.product.id ? item.product : { ...item.product, id: createId(), stock: 0, businessUnit: payload.businessUnit }
      return {
        productId: product.id,
        product,
        sku: product.sku,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      }
    })
    const total = sum(lineItems.map((item) => item.total))
    const recordId = existingTransaction?.id || createId()
    const record = {
      id: recordId, number: payload.invoiceNumber, invoiceNumber: payload.invoiceNumber,
      date: payload.date, businessUnit: payload.businessUnit, partyId: party.id,
      customer: payload.type === "sale" ? party.name : undefined,
      supplier: payload.type === "purchase" ? party.name : undefined,
      paymentMethod: payload.paymentMethod,
      leasingProvider: payload.leasingProvider || "",
      items: lineItems.map(({ product, ...item }) => item),
      total,
      status: payload.type === "sale" && payload.paymentMethod === "Kredit" ? "Piutang" : "Lunas",
    }
    const cashMovement = payload.paymentMethod === "Kredit" ? null : {
      id: createId(),
      sourceTransactionId: recordId,
      date: payload.date,
      businessUnit: payload.businessUnit,
      type: payload.type === "sale" ? "income" : "expense",
      accountType: payload.paymentMethod === "Cash" ? "cash" : "bank",
      account: payload.paymentMethod,
      amount: total,
      category: payload.type === "sale" ? "Penjualan" : "Pembelian",
      description: (payload.type === "sale" ? "Penjualan " : "Pembelian ") + payload.invoiceNumber + (party.name ? " · " + party.name : ""),
      reference: payload.invoiceNumber,
      paymentMethod: payload.paymentMethod,
    }

    setStore((current) => {
      const parties = current[partyCollection].some((item) => item.id === party.id)
        ? current[partyCollection].map((item) => item.id === party.id ? { ...item, ...party } : item)
        : [...current[partyCollection], party]
      let products = [...current.products]
      const stockChanges = new Map()
      const oldLines = existingTransaction
        ? Array.isArray(existingTransaction.items) && existingTransaction.items.length
          ? existingTransaction.items
          : existingTransaction.productId
            ? [{ productId: existingTransaction.productId, quantity: existingTransaction.quantity, unitPrice: existingTransaction.unitPrice }]
            : []
        : []
      oldLines.forEach((line) => {
        const quantity = Number(line.quantity) || 0
        const reverseChange = payload.type === "sale" ? quantity : -quantity
        stockChanges.set(line.productId, (stockChanges.get(line.productId) || 0) + reverseChange)
      })
      lineItems.forEach((line) => {
        if (!products.some((item) => item.id === line.productId)) products.push({ ...line.product, stock: 0 })
        const newChange = payload.type === "sale" ? -line.quantity : line.quantity
        stockChanges.set(line.productId, (stockChanges.get(line.productId) || 0) + newChange)
      })
      products = products.map((product) => {
        const stockChange = stockChanges.get(product.id)
        const updatedLine = lineItems.find((line) => line.productId === product.id)
        return {
          ...product,
          ...(stockChange == null ? {} : { stock: Math.max(0, (Number(product.stock) || 0) + stockChange) }),
          ...(payload.type === "purchase" && updatedLine ? { costPrice: updatedLine.unitPrice } : {}),
        }
      })

      let cashTransactions = current.cashTransactions.filter((entry) => entry.sourceTransactionId !== recordId)
      if (existingTransaction && !current.cashTransactions.some((entry) => entry.sourceTransactionId === recordId)) {
        const matchingMovementIndex = cashTransactions.findIndex((entry) =>
          entry.reference === existingTransaction.number &&
          entry.businessUnit === existingTransaction.businessUnit &&
          entry.date === existingTransaction.date &&
          entry.amount === existingTransaction.total &&
          entry.paymentMethod === existingTransaction.paymentMethod &&
          entry.category === (payload.type === "sale" ? "Penjualan" : "Pembelian"),
        )
        if (matchingMovementIndex >= 0) cashTransactions = cashTransactions.filter((_, index) => index !== matchingMovementIndex)
      }
      if (cashMovement) cashTransactions = [...cashTransactions, cashMovement]

      const records = existingTransaction
        ? current[collection].map((item) => item.id === recordId ? record : item)
        : [...current[collection], record]
      return { ...current, [partyCollection]: parties, products, [collection]: records, cashTransactions }
    })
  }

  function saveCashEntry(entry) {
    setStore((current) => ({ ...current, cashTransactions: [...current.cashTransactions, { ...entry, id: createId() }] }))
  }

  const selectedSales = useMemo(() => store.sales.filter((item) => selectedBusinessUnit === "all" || item.businessUnit === selectedBusinessUnit), [store.sales, selectedBusinessUnit])
  const selectedPurchases = useMemo(() => store.purchases.filter((item) => selectedBusinessUnit === "all" || item.businessUnit === selectedBusinessUnit), [store.purchases, selectedBusinessUnit])
  const selectedCash = useMemo(() => store.cashTransactions.filter((item) => selectedBusinessUnit === "all" || item.businessUnit === selectedBusinessUnit), [store.cashTransactions, selectedBusinessUnit])

  const dashboardData = useMemo(() => {
    const recent = [
      ...selectedSales.map((item) => ({ ...item, type: "Penjualan", amount: item.total, reference: item.number })),
      ...selectedPurchases.map((item) => ({ ...item, type: "Pembelian", amount: item.total, reference: item.number })),
    ].sort((a, b) => String(b.date).localeCompare(String(a.date)))
    const byDate = new Map()
    selectedSales.forEach((sale) => byDate.set(sale.date, (byDate.get(sale.date) || 0) + sale.total))
    const byUnit = new Map()
    selectedSales.forEach((sale) => byUnit.set(sale.businessUnit, (byUnit.get(sale.businessUnit) || 0) + sale.total))
    return {
      summary: {
        sales: selectedSales.length ? sum(selectedSales.map((item) => item.total)) : null,
        purchases: selectedPurchases.length ? sum(selectedPurchases.map((item) => item.total)) : null,
        cashAndBank: selectedCash.length ? sum(selectedCash.map((item) => item.type === "income" ? item.amount : -item.amount)) : null,
        receivables: selectedSales.some((item) => item.paymentMethod === "Kredit")
          ? sum(selectedSales.filter((item) => item.paymentMethod === "Kredit").map((item) => item.total))
          : null,
      },
      salesOverview: Array.from(byDate, ([label, value]) => ({ id: label, label, value })),
      salesByUnit: Array.from(byUnit, ([label, value]) => ({ id: label, label, value })),
      cashFlow: selectedCash.map((item) => ({ ...item, label: item.description, value: item.amount })),
      lowStock: store.products.filter((item) => item.minStock != null && Number(item.stock) <= Number(item.minStock)),
      recentTransactions: recent,
    }
  }, [selectedSales, selectedPurchases, selectedCash, store.products])

  const cashPageData = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const accountTypes = ["cash", "bank"]
    const accounts = ["furniture", "electronic-1", "electronic-2"].flatMap((unit) => accountTypes.map((type) => {
      const rows = store.cashTransactions.filter((item) => item.businessUnit === unit && item.accountType === type)
      if (!rows.length) return { businessUnit: unit, type, balance: null, todayIncome: null, todayExpense: null }
      return {
        businessUnit: unit, type,
        balance: sum(rows.map((item) => item.type === "income" ? item.amount : -item.amount)),
        todayIncome: sum(rows.filter((item) => item.date === today && item.type === "income").map((item) => item.amount)),
        todayExpense: sum(rows.filter((item) => item.date === today && item.type === "expense").map((item) => item.amount)),
      }
    }))
    return {
      summary: { balance: store.cashTransactions.length ? sum(store.cashTransactions.map((item) => item.type === "income" ? item.amount : -item.amount)) : null },
      accounts,
      transactions: selectedCash,
    }
  }, [store.cashTransactions, selectedCash])

  const reportData = useMemo(() => ({
    summary: [],
    rows: [
      ...selectedSales.map((item) => ({ id: item.id, date: item.date, businessUnit: item.businessUnit, type: "Penjualan", description: item.customer, category: "Penjualan", amount: item.total })),
      ...selectedPurchases.map((item) => ({ id: item.id, date: item.date, businessUnit: item.businessUnit, type: "Pembelian", description: item.supplier, category: "Pembelian", amount: item.total })),
      ...selectedCash.map((item) => ({ ...item, type: item.type === "income" ? "Kas masuk" : "Kas keluar", category: item.category, amount: item.amount })),
    ],
  }), [selectedSales, selectedPurchases, selectedCash])

  function renderPage() {
    if (activeItem === "sales") return <SalesPage data={selectedSales} onCreateTransaction={() => setTransactionDraft({ type: "sale", record: null })} onEditTransaction={(record) => setTransactionDraft({ type: "sale", record })} />
    if (activeItem === "purchases") return <PurchasesPage data={selectedPurchases} onCreateTransaction={() => setTransactionDraft({ type: "purchase", record: null })} onEditTransaction={(record) => setTransactionDraft({ type: "purchase", record })} />
    if (activeItem === "inventory") return <InventoryPage data={store.products} onSaveProduct={saveProduct} />
    if (activeItem === "customers") return <CustomersPage data={store.customers} onCreateCustomer={saveCustomer} onUpdateCustomer={updateCustomer} onDeleteCustomer={deleteCustomer} />
    if (activeItem === "suppliers") return <SuppliersPage data={store.suppliers} onCreateSupplier={saveSupplier} />
    if (activeItem === "cash") return <CashFlowPage data={cashPageData} onCreateCashEntry={() => setIsCashModalOpen(true)} />
    if (activeItem === "reports") return <ReportsPage data={reportData} selectedBusinessUnit={selectedBusinessUnit} onBusinessUnitChange={setSelectedBusinessUnit} />
    if (activeItem === "settings") return <SettingPage />
    return <DashboardPage data={dashboardData} selectedBusinessUnit={selectedBusinessUnit} onCreateTransaction={() => setTransactionDraft({ type: "sale", record: null })} />
  }

  return (
    <div className={"app-layout " + (isDarkMode ? "app-layout--dark" : "")} data-theme={isDarkMode ? "dark" : "light"}>
      <Sidebar activeItem={activeItem} onNavigate={setActiveItem} selectedBusinessUnit={selectedBusinessUnit} onBusinessUnitChange={setSelectedBusinessUnit} />
      <div className="app-layout__main">
        <TopBar title={pageTitles[activeItem] || "Dashboard"} searchValue={searchValue} onSearchChange={setSearchValue} isDarkMode={isDarkMode} onThemeToggle={() => setIsDarkMode((current) => !current)} userName="Admin" userRole="Administrator" userInitials="TN" />
        <main className="app-layout__content">{renderPage()}</main>
      </div>
      {transactionDraft && <TransactionFormModal key={transactionDraft.record?.id || transactionDraft.type} initialType={transactionDraft.type} initialTransaction={transactionDraft.record} isOpen onClose={() => setTransactionDraft(null)} onSave={(payload) => saveTransaction(payload, transactionDraft.record)} products={store.products} customers={store.customers} suppliers={store.suppliers} />}
      <CashEntryModal isOpen={isCashModalOpen} onClose={() => setIsCashModalOpen(false)} onSave={saveCashEntry} />
    </div>
  )
}

export default AppLayout
