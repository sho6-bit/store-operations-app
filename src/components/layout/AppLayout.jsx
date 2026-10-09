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
import SettlementModal from "../../pages/Sales/SettlementModal.jsx"
import { createId, readStoreData, writeStoreData } from "../../services/dataProvider.js"
import { readAppSettings, writeAppSettings } from "../../services/settingsProvider.js"
import { supabase } from "../../lib/supabaseClient.js"

const pageTitles = {
  dashboard: "Dashboard", sales: "Penjualan", purchases: "Pembelian", inventory: "Stok",
  customers: "Customer", suppliers: "Supplier", cash: "Kas & Bank", reports: "Laporan", settings: "Pengaturan",
}

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0)
}

function AppLayout({ onLogout }) {
  const [activeItem, setActiveItem] = useState("dashboard")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState("all")
  const [searchValue, setSearchValue] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [store, setStore] = useState(readStoreData)
  const [settings, setSettings] = useState(readAppSettings)
  const [cloudUserId, setCloudUserId] = useState(null)
  const [isCloudReady, setIsCloudReady] = useState(false)
  const [cloudSyncError, setCloudSyncError] = useState("")
  const [transactionDraft, setTransactionDraft] = useState(null)
  const [isCashModalOpen, setIsCashModalOpen] = useState(false)
  const [settlementSale, setSettlementSale] = useState(null)

  useEffect(() => { writeStoreData(store) }, [store])
  useEffect(() => { writeAppSettings(settings) }, [settings])
  useEffect(() => {
    let isActive = true
    async function loadCloudData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!user) throw new Error("Sesi login tidak ditemukan.")
        const { data: row, error } = await supabase.from("store_app_data").select("app_data").eq("user_id", user.id).maybeSingle()
        if (error) throw error
        const collections = ["products", "customers", "suppliers", "sales", "purchases", "cashTransactions"]
        const savedStore = row?.app_data?.store
        const hasSavedStore = savedStore && collections.every((key) => Array.isArray(savedStore[key]))
        if (hasSavedStore) {
          if (isActive) {
            setStore(Object.fromEntries(collections.map((key) => [key, savedStore[key]])))
            if (row.app_data.settings) setSettings(row.app_data.settings)
          }
        } else {
          const initialData = { store: readStoreData(), settings: readAppSettings() }
          const { error: saveError } = await supabase.from("store_app_data").upsert({ user_id: user.id, app_data: initialData, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
          if (saveError) throw saveError
        }
        if (isActive) {
          setCloudUserId(user.id)
          setCloudSyncError("")
          setIsCloudReady(true)
        }
      } catch (error) {
        if (isActive) {
          setCloudSyncError(error?.message || "Data belum dapat disambungkan ke Supabase.")
          setIsCloudReady(true)
        }
      }
    }
    loadCloudData()
    return () => { isActive = false }
  }, [])

  useEffect(() => {
    if (!isCloudReady || !cloudUserId) return undefined
    let isActive = true
    const timer = window.setTimeout(async () => {
      const { error } = await supabase.from("store_app_data").upsert({ user_id: cloudUserId, app_data: { store, settings }, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      if (isActive) setCloudSyncError(error?.message || "")
    }, 500)
    return () => { isActive = false; window.clearTimeout(timer) }
  }, [store, settings, isCloudReady, cloudUserId])

  async function saveSettings(nextSettings) {
    const normalizedSettings = { ...nextSettings, storeProfile: { ...nextSettings.storeProfile, name: "Toko Noni" } }
    if (!cloudUserId) throw new Error("Sesi Supabase belum siap. Muat ulang halaman lalu coba lagi.")
    const { error } = await supabase.from("store_app_data").upsert({
      user_id: cloudUserId,
      app_data: { store, settings: normalizedSettings },
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    if (error) throw error
    setSettings(normalizedSettings)
  }
  function restoreBackup(backup) {
    setStore(backup.store)
    if (backup.settings) setSettings(backup.settings)
  }
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
  function updateSupplier(id, supplier) {
    setStore((current) => ({ ...current, suppliers: current.suppliers.map((item) => item.id === id ? { ...item, ...supplier } : item) }))
  }
  function deleteSupplier(id) {
    setStore((current) => ({ ...current, suppliers: current.suppliers.filter((item) => item.id !== id) }))
  }

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

    const unitMismatch = payload.items.find((item) => {
      const productUnit = item.product.businessUnitId ?? item.product.businessUnit
      return productUnit && productUnit !== payload.businessUnit
    })
    if (unitMismatch) throw new Error("Produk harus berasal dari unit usaha yang sama dengan transaksi.")
    const newSkus = payload.items.filter((item) => !item.product.id).map((item) => item.product.sku.toLowerCase())
    if (newSkus.some((sku) => store.products.some((product) => product.sku?.toLowerCase() === sku))) {
      throw new Error("Salah satu SKU produk baru sudah terdaftar. Pilih produk yang tersedia.")
    }
    const partyCollection = payload.type === "sale" ? "customers" : "suppliers"
    const party = payload.party.id ? payload.party : { ...payload.party, id: createId() }
    const lineItems = payload.items.map((item) => {
      const product = item.product.id ? item.product : { ...item.product, id: createId(), stock: 0, businessUnit: payload.businessUnit }
      const previousLine = existingTransaction?.items?.find((line) => line.productId === product.id || line.sku === product.sku)
      return {
        productId: product.id,
        product,
        sku: product.sku,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
        costPriceAtSale: payload.type === "sale"
          ? (previousLine
            ? previousLine.costPriceAtSale ?? null
            : product.costPrice ?? product.cost ?? null)
          : null,
      }
    })
    const total = sum(lineItems.map((item) => item.total))
    const recordId = existingTransaction?.id || createId()
    const existingSettlements = existingTransaction?.settlements || []
    const settlementTotal = sum(existingSettlements.map((payment) => payment.amount))
    const isBusinessDebt = payload.type === "purchase" && payload.paymentMethod === "Hutang Usaha"
    const initialPaymentAmount = isBusinessDebt ? 0 : payload.paymentMethod === "DP" ? payload.downPayment : total
    if (settlementTotal + initialPaymentAmount > total) {
      throw new Error("Total invoice tidak boleh lebih kecil dari pembayaran yang sudah diterima.")
    }
    const paidAmount = initialPaymentAmount + settlementTotal
    const record = {
      id: recordId, number: payload.invoiceNumber, invoiceNumber: payload.invoiceNumber,
      date: payload.date, businessUnit: payload.businessUnit, partyId: party.id,
      customer: payload.type === "sale" ? party.name : undefined,
      supplier: payload.type === "purchase" ? party.name : undefined,
      paymentMethod: payload.paymentMethod,
      paymentChannel: payload.paymentChannel || "",
      leasingProvider: payload.leasingProvider || "",
      dueDate: payload.dueDate || "",
      downPayment: payload.paymentMethod === "DP" ? payload.downPayment : 0,
      paidAmount,
      remainingAmount: Math.max(0, total - paidAmount),
      note: payload.note || "",
      settlements: existingSettlements,
      items: lineItems.map(({ product, ...item }) => item),
      total,
      status: isBusinessDebt ? "Hutang" : payload.type === "sale" && paidAmount < total ? "Piutang" : "Lunas",
    }
    const cashMovement = isBusinessDebt ? null : {
      id: createId(),
      sourceTransactionId: recordId,
      date: payload.date,
      businessUnit: payload.businessUnit,
      type: payload.type === "sale" ? "income" : "expense",
      accountType: (payload.paymentMethod === "DP" ? payload.paymentChannel : payload.paymentMethod) === "Cash" ? "cash" : "bank",
      account: payload.paymentMethod === "Kredit" ? "Kredit Â· " + payload.leasingProvider : payload.paymentMethod === "DP" ? payload.paymentChannel : payload.paymentMethod,
      amount: initialPaymentAmount,
      category: payload.type === "sale" ? "Penjualan" : "Pembelian",
      description: (payload.type === "sale" ? "Penjualan " : "Pembelian ") + payload.invoiceNumber + (party.name ? " Â· " + party.name : ""),
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
          ...(product.businessUnit ? {} : { businessUnit: payload.businessUnit }),
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

  function saveSettlement({ transactionId, date, channel }) {
    const sale = store.sales.find((item) => item.id === transactionId)
    if (!sale) throw new Error("Transaksi penjualan tidak ditemukan.")
    const remaining = Number(sale.remainingAmount ?? (sale.total - (sale.paidAmount || 0)))
    if (remaining <= 0) throw new Error("Transaksi ini sudah lunas.")
    const settlementId = createId()
    const payment = { id: settlementId, date, method: channel, amount: remaining }
    const movement = {
      id: createId(), sourceSettlementId: settlementId, transactionId: sale.id,
      date, businessUnit: sale.businessUnit, type: "income",
      accountType: channel === "Cash" ? "cash" : "bank", account: channel,
      amount: remaining, category: "Pelunasan Penjualan",
      description: "Pelunasan invoice " + sale.number + (sale.customer ? " Â· " + sale.customer : ""),
      reference: sale.number, paymentMethod: channel,
    }
    setStore((current) => ({
      ...current,
      sales: current.sales.map((item) => item.id === sale.id ? {
        ...item,
        settlements: [...(item.settlements || []), payment],
        paidAmount: Number(item.paidAmount || 0) + remaining,
        remainingAmount: 0,
        status: "Lunas",
      } : item),
      cashTransactions: [...current.cashTransactions, movement],
    }))
  }

  function saveCashEntry(entry) {
    const account = settings.accounts[entry.businessUnit]?.[entry.accountType] || entry.account
    setStore((current) => ({ ...current, cashTransactions: [...current.cashTransactions, { ...entry, account, id: createId() }] }))
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
        receivables: selectedSales.some((item) => item.paymentMethod === "DP")
          ? sum(selectedSales.filter((item) => item.paymentMethod === "DP").map((item) => Number(item.remainingAmount ?? (item.total - (item.downPayment || 0)))))
          : null,
      },
      salesOverview: Array.from(byDate, ([label, value]) => ({ id: label, label, value })),
      salesByUnit: Array.from(byUnit, ([label, value]) => ({ id: label, label, value })),
      cashFlow: selectedCash.map((item) => ({ ...item, label: item.description, value: item.amount })),
      lowStock: store.products.filter((item) => Number(item.stock) > 0 && Number(item.stock) <= Number(item.reorderLevel ?? item.minStock ?? settings.stockLowThreshold)),
      recentTransactions: recent,
    }
  }, [selectedSales, selectedPurchases, selectedCash, store.products, settings.stockLowThreshold])

  const cashPageData = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const accountTypes = ["cash", "bank"]
    const accounts = settings.businessUnits.flatMap((unit) => accountTypes.map((type) => {
      const rows = store.cashTransactions.filter((item) => item.businessUnit === unit.id && item.accountType === type)
      if (!rows.length) return { businessUnit: unit.id, type, name: settings.accounts[unit.id]?.[type], balance: null, todayIncome: null, todayExpense: null }
      return {
        businessUnit: unit.id, type, name: settings.accounts[unit.id]?.[type],
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
  }, [store.cashTransactions, selectedCash, settings])

  const reportData = useMemo(() => ({
    sales: selectedSales,
    purchases: selectedPurchases,
    cashTransactions: selectedCash,
    products: selectedBusinessUnit === "all"
      ? store.products
      : store.products.filter((product) => (product.businessUnitId ?? product.businessUnit) === selectedBusinessUnit),
  }), [selectedSales, selectedPurchases, selectedCash, selectedBusinessUnit, store.products])

  const globalSearchResults = useMemo(() => {
    const query = searchValue.trim().toLocaleLowerCase("id-ID")
    if (!query) return []
    const includes = (...values) => values.filter((value) => value != null && value !== "").some((value) => String(value).toLocaleLowerCase("id-ID").includes(query))
    const results = []
    store.sales.forEach((sale) => { if (includes(sale.number, sale.invoiceNumber, sale.customer, sale.businessUnit, sale.paymentMethod, sale.status, sale.date, sale.total)) results.push({ id: "sale:" + sale.id, type: "Penjualan", title: sale.number || sale.invoiceNumber || "Transaksi penjualan", subtitle: [sale.customer, sale.businessUnit, sale.date].filter(Boolean).join(" · "), page: "sales" }) })
    store.purchases.forEach((item) => { if (includes(item.number, item.invoiceNumber, item.supplier, item.businessUnit, item.paymentMethod, item.status, item.date, item.total)) results.push({ id: "purchase:" + item.id, type: "Pembelian", title: item.number || item.invoiceNumber || "Transaksi pembelian", subtitle: [item.supplier, item.businessUnit, item.date].filter(Boolean).join(" · "), page: "purchases" }) })
    store.products.forEach((item) => { if (includes(item.name, item.sku, item.category, item.businessUnit, item.businessUnitId)) results.push({ id: "product:" + item.id, type: "Produk", title: item.name || item.sku, subtitle: [item.sku, item.businessUnit ?? item.businessUnitId].filter(Boolean).join(" · "), page: "inventory" }) })
    store.customers.forEach((item) => { if (includes(item.name, item.phone, item.email, item.address)) results.push({ id: "customer:" + item.id, type: "Pelanggan", title: item.name, subtitle: [item.phone, item.address].filter(Boolean).join(" · "), page: "customers" }) })
    store.suppliers.forEach((item) => { if (includes(item.name, item.phone, item.email, item.address)) results.push({ id: "supplier:" + item.id, type: "Supplier", title: item.name, subtitle: [item.phone, item.address].filter(Boolean).join(" · "), page: "suppliers" }) })
    store.cashTransactions.forEach((item) => { if (includes(item.description, item.reference, item.category, item.account, item.businessUnit, item.date)) results.push({ id: "cash:" + item.id, type: "Kas & Bank", title: item.description || item.reference || item.category || "Mutasi kas", subtitle: [item.account, item.businessUnit, item.date].filter(Boolean).join(" · "), page: "cash" }) })
    return results.slice(0, 8)
  }, [searchValue, store.sales, store.purchases, store.products, store.customers, store.suppliers, store.cashTransactions])

  function handleSearchResultSelect(result) {
    setSelectedBusinessUnit("all")
    setActiveItem(result.page)
    setSearchValue(result.title || searchValue)
  }

  function renderPage() {
    if (activeItem === "sales") return <SalesPage businessUnits={settings.businessUnits} data={selectedSales} globalSearchValue={searchValue} onCreateTransaction={() => setTransactionDraft({ type: "sale", record: null })} onEditTransaction={(record) => setTransactionDraft({ type: "sale", record })} onSettleTransaction={setSettlementSale} />
    if (activeItem === "purchases") return <PurchasesPage businessUnits={settings.businessUnits} data={selectedPurchases} globalSearchValue={searchValue} onCreateTransaction={() => setTransactionDraft({ type: "purchase", record: null })} onEditTransaction={(record) => setTransactionDraft({ type: "purchase", record })} />
    if (activeItem === "inventory") return <InventoryPage data={store.products} globalSearchValue={searchValue} businessUnits={settings.businessUnits} stockLowThreshold={settings.stockLowThreshold} onSaveProduct={saveProduct} />
    if (activeItem === "customers") return <CustomersPage data={store.customers} globalSearchValue={searchValue} onCreateCustomer={saveCustomer} onUpdateCustomer={updateCustomer} onDeleteCustomer={deleteCustomer} />
    if (activeItem === "suppliers") return <SuppliersPage data={store.suppliers} globalSearchValue={searchValue} onCreateSupplier={saveSupplier} onUpdateSupplier={updateSupplier} onDeleteSupplier={deleteSupplier} />
    if (activeItem === "cash") return <CashFlowPage data={cashPageData} globalSearchValue={searchValue} businessUnits={settings.businessUnits} onCreateCashEntry={() => setIsCashModalOpen(true)} />
    if (activeItem === "reports") return <ReportsPage businessUnits={settings.businessUnits} data={reportData} selectedBusinessUnit={selectedBusinessUnit} onBusinessUnitChange={setSelectedBusinessUnit} />
    if (activeItem === "settings") return <SettingPage settings={settings} storeData={store} onSaveSettings={saveSettings} onRestoreData={restoreBackup} onLogout={onLogout} />
    return <DashboardPage businessUnits={settings.businessUnits} data={dashboardData} selectedBusinessUnit={selectedBusinessUnit} onCreateTransaction={() => setTransactionDraft({ type: "sale", record: null })} />
  }

  if (!isCloudReady) return <div className="app-cloud-loading">Menghubungkan data toko…</div>

  return (
    <div className={"app-layout " + (isDarkMode ? "app-layout--dark " : "") + (isSidebarCollapsed ? "app-layout--collapsed" : "")} data-theme={isDarkMode ? "dark" : "light"}>
      {cloudSyncError && <div className="app-cloud-sync-error" role="alert">Sinkronisasi Supabase belum berhasil: {cloudSyncError}</div>}
      <Sidebar storeProfile={settings.storeProfile} businessUnits={settings.businessUnits} activeItem={activeItem} onNavigate={setActiveItem} selectedBusinessUnit={selectedBusinessUnit} onBusinessUnitChange={setSelectedBusinessUnit} onCollapsedChange={setIsSidebarCollapsed} />
      <div className="app-layout__main">
        <TopBar onLogout={onLogout} title={pageTitles[activeItem] || "Dashboard"} searchValue={searchValue} onSearchChange={setSearchValue} searchResults={globalSearchResults} onSearchResultSelect={handleSearchResultSelect} onNavigate={setActiveItem} isDarkMode={isDarkMode} onThemeToggle={() => setIsDarkMode((current) => !current)} userName="Admin" userRole="Administrator" userInitials="TN" />
        <main className="app-layout__content">{renderPage()}</main>
      </div>
      {transactionDraft && <TransactionFormModal key={transactionDraft.record?.id || transactionDraft.type} initialType={transactionDraft.type} initialTransaction={transactionDraft.record} isOpen onClose={() => setTransactionDraft(null)} onSave={(payload) => saveTransaction(payload, transactionDraft.record)} businessUnits={settings.businessUnits} products={store.products} customers={store.customers} suppliers={store.suppliers} />}
      <CashEntryModal businessUnits={settings.businessUnits} isOpen={isCashModalOpen} onClose={() => setIsCashModalOpen(false)} onSave={saveCashEntry} />
      {settlementSale && <SettlementModal sale={settlementSale} onClose={() => setSettlementSale(null)} onSave={saveSettlement} />}
    </div>
  )
}

export default AppLayout
