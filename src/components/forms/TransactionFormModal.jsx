import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import Button from "../common/Button"
import Modal from "../common/Modal"
import { createId } from "../../services/dataProvider.js"
import "./transactionFormModal.css"

const units = [
  { id: "furniture", label: "Furniture" },
  { id: "electronic-1", label: "Electronic 1" },
  { id: "electronic-2", label: "Electronic 2" },
]

function createBlankItem() {
  return {
    id: createId(),
    productId: "",
    newSku: "",
    newProductName: "",
    newCostPrice: "",
    newSalePrice: "",
    quantity: "",
    unitPrice: "",
    discount: "0",
  }
}

const blankForm = {
  type: "sale",
  businessUnit: "",
  date: "",
  invoiceNumber: "",
  dueDate: "",
  paymentMethod: "Cash",
  paymentChannel: "",
  downPayment: "",
  note: "",
  leasingProvider: "",
  partyId: "",
  newPartyName: "",
  newPartyAddress: "",
  newPartyPhone: "",
  items: [createBlankItem()],
}


function makeInitialForm(transaction, type, products, parties) {
  if (!transaction) return { ...blankForm, type, items: [createBlankItem()] }
  const originalItems = Array.isArray(transaction.items) && transaction.items.length
    ? transaction.items
    : transaction.productId || transaction.sku
      ? [{
          productId: transaction.productId,
          sku: transaction.sku,
          productName: transaction.productName,
          quantity: transaction.quantity,
          unitPrice: transaction.unitPrice,
          discount: transaction.discount,
        }]
      : []
  const items = originalItems.map((line) => {
    const product = products.find((entry) => entry.id === line.productId || (line.sku && entry.sku?.toLowerCase() === String(line.sku).toLowerCase()))
    return {
      ...createBlankItem(),
      productId: product?.id || "__new__",
      newSku: product ? "" : line.sku || "",
      newProductName: product ? "" : line.productName || "",
      newCostPrice: "",
      newSalePrice: "",
      quantity: line.quantity == null ? "" : String(line.quantity),
      unitPrice: line.unitPrice == null ? "" : String(line.unitPrice),
      discount: line.discount == null ? "0" : String(line.discount),
    }
  })
  const matchingParty = parties.find((party) => party.id === transaction.partyId || party.name === (type === "sale" ? transaction.customer : transaction.supplier))
  const partyName = type === "sale" ? transaction.customer : transaction.supplier
  return {
    ...blankForm,
    type,
    businessUnit: transaction.businessUnit || "",
    date: transaction.date || "",
    invoiceNumber: transaction.invoiceNumber || transaction.number || "",
    dueDate: transaction.dueDate || "",
    paymentMethod: transaction.paymentMethod || "",
    paymentChannel: transaction.paymentChannel || "",
    downPayment: transaction.downPayment == null ? "" : String(transaction.downPayment),
    note: transaction.note || "",
    leasingProvider: transaction.leasingProvider || "",
    partyId: matchingParty?.id || (partyName ? "__new__" : ""),
    newPartyName: matchingParty ? "" : partyName || "",
    newPartyAddress: "",
    newPartyPhone: "",
    items: items.length ? items : [createBlankItem()],
  }
}

function TransactionFormModal({
  isOpen,
  initialType = "sale",
  initialTransaction = null,
  onClose,
  onSave,
  products = [],
  customers = [],
  suppliers = [],
}) {
  const initialParties = initialType === "sale" ? customers : suppliers
  const [form, setForm] = useState(() => makeInitialForm(initialTransaction, initialType, products, initialParties))
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const hasRecordedSettlements = Boolean(initialTransaction?.settlements?.length)

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateItem(itemId, name, value) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => item.id === itemId ? { ...item, [name]: value } : item),
    }))
  }

  function addItem() {
    setForm((current) => ({ ...current, items: [...current.items, createBlankItem()] }))
  }

  function removeItem(itemId) {
    setForm((current) => current.items.length <= 1
      ? current
      : { ...current, items: current.items.filter((item) => item.id !== itemId) })
  }

  function close() {
    if (isSaving) return
    setError("")
    setForm({ ...blankForm, type: initialType, items: [createBlankItem()] })
    onClose?.()
  }

  function handleBusinessUnitChange(businessUnit) {
    setForm((current) => ({
      ...current,
      businessUnit,
      items: current.items.map((item) => {
        const product = products.find((entry) => entry.id === item.productId)
        const productUnit = product?.businessUnitId ?? product?.businessUnit
        return productUnit && productUnit !== businessUnit
          ? { ...item, productId: "", unitPrice: "" }
          : item
      }),
    }))
  }

  function handleTypeChange(type) {
    setForm((current) => ({
      ...current,
      type,
      partyId: "",
      paymentMethod: "Cash",
      dueDate: "",
      paymentChannel: "",
      downPayment: "",
      note: "",
      leasingProvider: "",
    }))
  }

  function handleProductChange(itemId, productId) {
    const product = products.find((entry) => entry.id === productId)
    const suggestedPrice = form.type === "sale"
      ? product?.referencePrice ?? product?.price
      : product?.costPrice ?? product?.cost
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => item.id === itemId
        ? { ...item, productId, unitPrice: suggestedPrice == null ? "" : String(suggestedPrice) }
        : item),
    }))
  }

  const partyOptions = form.type === "sale" ? customers : suppliers
  const availableProducts = products.filter((product) => {
    const productUnit = product.businessUnitId ?? product.businessUnit
    return !form.businessUnit || !productUnit || productUnit === form.businessUnit
  })
  const invoiceSubtotal = form.items.reduce((total, item) => {
    return total + Math.max(0, (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0))
  }, 0)

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")

    if (!form.businessUnit || !form.date || !form.invoiceNumber.trim()) {
      setError("Unit usaha, tanggal, dan nomor invoice wajib diisi.")
      return
    }
    if (!form.partyId) {
      setError("Pilih atau buat pembeli/supplier.")
      return
    }
    if (form.partyId === "__new__" && !form.newPartyName.trim()) {
      setError("Nama pembeli/supplier baru wajib diisi.")
      return
    }
    if (!form.paymentMethod) {
      setError("Pilih metode pembayaran.")
      return
    }
    if (form.type === "purchase" && form.paymentMethod === "Hutang Usaha" && !form.dueDate) {
      setError("Tanggal jatuh tempo wajib diisi untuk Hutang Usaha.")
      return
    }
    if (form.type === "sale" && form.paymentMethod === "Kredit" && !form.leasingProvider) {
      setError("Pilih leasing yang digunakan untuk transaksi kredit.")
      return
    }
    if (!form.items.length) {
      setError("Tambahkan sedikitnya satu barang ke transaksi.")
      return
    }

    const lineProducts = []
    for (let index = 0; index < form.items.length; index += 1) {
      const item = form.items[index]
      if (!item.productId) {
        setError("Pilih produk atau buat SKU baru pada barang ke-" + (index + 1) + ".")
        return
      }
      if (item.productId === "__new__" && (!item.newSku.trim() || !item.newProductName.trim())) {
        setError("Nama dan SKU wajib diisi pada produk baru ke-" + (index + 1) + ".")
        return
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        setError("Jumlah harus lebih besar dari nol pada barang ke-" + (index + 1) + ".")
        return
      }
      if (item.unitPrice === "" || Number(item.unitPrice) < 0) {
        setError("Harga per unit wajib diisi pada barang ke-" + (index + 1) + ".")
        return
      }
      if (Number(item.discount) < 0 || Number(item.discount) > Number(item.quantity) * Number(item.unitPrice)) {
        setError("Diskon barang ke-" + (index + 1) + " tidak boleh melebihi subtotal barang.")
        return
      }

      const existingProduct = item.productId === "__new__"
        ? null
        : products.find((product) => product.id === item.productId)
      const product = existingProduct || {
        sku: item.newSku.trim(),
        name: item.newProductName.trim(),
        costPrice: Number(item.newCostPrice) || 0,
        referencePrice: Number(item.newSalePrice) || 0,
        price: Number(item.newSalePrice) || 0,
      }
      const productKey = String(product.id || product.sku).toLowerCase()
      if (lineProducts.some((line) => line.key === productKey)) {
        setError("Produk/SKU yang sama muncul lebih dari sekali. Gabungkan jumlahnya dalam satu baris.")
        return
      }
      lineProducts.push({
        key: productKey,
        product,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount) || 0,
      })
    }

    const duplicateNewSku = lineProducts.find((line) =>
      !line.product.id && products.some((product) => product.sku?.toLowerCase() === line.product.sku.toLowerCase()),
    )
    if (duplicateNewSku) {
      setError("SKU " + duplicateNewSku.product.sku + " sudah terdaftar. Pilih produk yang tersedia.")
      return
    }

    const invoiceTotal = lineProducts.reduce((total, line) => total + line.quantity * line.unitPrice - line.discount, 0)
    if (form.type === "sale" && form.paymentMethod === "DP") {
      if (!form.paymentChannel) {
        setError("Pilih saluran pembayaran untuk DP.")
        return
      }
      if (!form.downPayment || Number(form.downPayment) <= 0 || Number(form.downPayment) >= invoiceTotal) {
        setError("Nominal DP harus lebih dari nol dan kurang dari total invoice. Untuk pembayaran penuh, pilih metode pembayaran lunas.")
        return
      }
    }

    const existingParty = partyOptions.find((party) => party.id === form.partyId)
    const payload = {
      type: form.type,
      businessUnit: form.businessUnit,
      date: form.date,
      transactionId: initialTransaction?.id,
      invoiceNumber: form.invoiceNumber.trim(),
      dueDate: form.type === "purchase" && form.paymentMethod === "Hutang Usaha" ? form.dueDate : "",
      paymentMethod: form.paymentMethod,
      paymentChannel: form.type === "sale" && form.paymentMethod === "DP" ? form.paymentChannel : "",
      downPayment: form.type === "sale" && form.paymentMethod === "DP" ? Number(form.downPayment) : 0,
      note: form.type === "sale" && form.paymentMethod === "DP" ? form.note.trim() : "",
      leasingProvider: form.paymentMethod === "Kredit" ? form.leasingProvider : "",
      party: form.partyId === "__new__"
        ? { name: form.newPartyName.trim(), address: form.newPartyAddress.trim(), phone: form.newPartyPhone.trim() }
        : { id: existingParty?.id, name: existingParty?.name },
      items: lineProducts.map((line) => ({
        product: line.product,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        total: line.quantity * line.unitPrice - line.discount,
      })),
    }

    setIsSaving(true)
    try {
      await onSave(payload)
      setForm({ ...blankForm, type: initialType, items: [createBlankItem()] })
      onClose?.()
    } catch (saveError) {
      setError(saveError?.message || "Transaksi gagal disimpan.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={form.type === "sale" ? "Buat transaksi penjualan" : "Buat transaksi pembelian"}
      size="large"
    >
      <form className="transaction-form" onSubmit={handleSubmit}>
        <div className="transaction-form__grid">
          <label className="transaction-form__field">
            <span>Unit usaha <b>*</b></span>
            <select value={form.businessUnit} onChange={(event) => handleBusinessUnitChange(event.target.value)} required disabled={Boolean(initialTransaction)}>
              <option value="">Pilih unit usaha</option>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
            </select>
          </label>
          <label className="transaction-form__field">
            <span>Jenis transaksi <b>*</b></span>
            <select value={form.type} onChange={(event) => handleTypeChange(event.target.value)} disabled={Boolean(initialTransaction)}>
              <option value="sale">Jual</option>
              <option value="purchase">Beli</option>
            </select>
          </label>
          <label className="transaction-form__field">
            <span>Tanggal <b>*</b></span>
            <input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} required />
          </label>
          <label className="transaction-form__field">
            <span>Nomor invoice dari nota <b>*</b></span>
            <input value={form.invoiceNumber} onChange={(event) => update("invoiceNumber", event.target.value)} placeholder="Masukkan nomor dari nota" required />
          </label>
          <label className="transaction-form__field">
            <span>Metode pembayaran <b>*</b></span>
            <select value={form.paymentMethod} onChange={(event) => { update("paymentMethod", event.target.value); update("leasingProvider", "") }} required disabled={hasRecordedSettlements}>
              {!form.paymentMethod && <option value="">Pilih metode pembayaran</option>}
              <option value="Cash">Cash</option>
              {form.type === "sale" && <option value="QRIS">QRIS</option>}
              <option value="Transfer Bank">Transfer Bank</option>
              {form.type === "sale" && <option value="Kredit">Kredit · dilunasi leasing</option>}
              {form.type === "sale" && <option value="DP">DP</option>}
              {form.type === "purchase" && <option value="Hutang Usaha">Hutang Usaha</option>}
            </select>
          </label>
          {form.type === "purchase" && form.paymentMethod === "Hutang Usaha" && (
            <label className="transaction-form__field">
              <span>Tanggal jatuh tempo <b>*</b></span>
              <input type="date" value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} required />
            </label>
          )}
          {form.type === "sale" && form.paymentMethod === "DP" && (
            <>
              <label className="transaction-form__field">
                <span>Nominal DP (Rp) <b>*</b></span>
                <input type="number" min="1" step="1" value={form.downPayment} onChange={(event) => update("downPayment", event.target.value)} required disabled={hasRecordedSettlements} />
              </label>
              <label className="transaction-form__field">
                <span>DP diterima melalui <b>*</b></span>
                <select value={form.paymentChannel} onChange={(event) => update("paymentChannel", event.target.value)} required disabled={hasRecordedSettlements}>
                  <option value="">Pilih saluran pembayaran</option>
                  <option value="Cash">Cash</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                </select>
              </label>
              <label className="transaction-form__field transaction-form__field--wide">
                <span>Catatan DP</span>
                <textarea rows="2" value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="Contoh: barang tempahan atau dibayar sekarang, diantar nanti" />
              </label>
            </>
          )}
          {form.type === "sale" && form.paymentMethod === "Kredit" && (
            <label className="transaction-form__field">
              <span>Leasing <b>*</b></span>
              <select value={form.leasingProvider} onChange={(event) => update("leasingProvider", event.target.value)} required>
                <option value="">Pilih leasing</option>
                <option value="FIF">FIF</option>
                <option value="Kredivo">Kredivo</option>
                <option value="ShopeePayLater">ShopeePayLater</option>
                <option value="Akulaku">Akulaku</option>
                <option value="HCI">HCI</option>
              </select>
            </label>
          )}
        </div>

        <section className="transaction-form__section">
          <h3>{form.type === "sale" ? "Pembeli" : "Supplier"}</h3>
          <label className="transaction-form__field">
            <span>{form.type === "sale" ? "Pilih pembeli" : "Pilih supplier"} <b>*</b></span>
            <select value={form.partyId} onChange={(event) => update("partyId", event.target.value)} required>
              <option value="">Pilih {form.type === "sale" ? "pembeli" : "supplier"}</option>
              {partyOptions.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
              <option value="__new__">+ Buat {form.type === "sale" ? "pembeli" : "supplier"} baru</option>
            </select>
          </label>
          {form.partyId === "__new__" && (
            <div className="transaction-form__grid transaction-form__grid--new">
              <label className="transaction-form__field"><span>Nama <b>*</b></span><input value={form.newPartyName} onChange={(event) => update("newPartyName", event.target.value)} required /></label>
              <label className="transaction-form__field"><span>No. HP</span><input type="tel" value={form.newPartyPhone} onChange={(event) => update("newPartyPhone", event.target.value)} /></label>
              <label className="transaction-form__field transaction-form__field--wide"><span>Alamat</span><input value={form.newPartyAddress} onChange={(event) => update("newPartyAddress", event.target.value)} /></label>
            </div>
          )}
        </section>

        <section className="transaction-form__section">
          <div className="transaction-form__items-heading">
            <div><h3>Barang dalam nota</h3><p>Tambahkan semua produk yang tercantum pada nota ini.</p></div>
            <Button variant="secondary" type="button" onClick={addItem}><Plus size={15} />Tambah barang</Button>
          </div>

          <div className="transaction-form__items">
            {form.items.map((item, index) => {
              const isNewProduct = item.productId === "__new__"
              const chosenProduct = availableProducts.find((product) => product.id === item.productId)
              const lineTotal = Math.max(0, Number(item.quantity || 0) * Number(item.unitPrice || 0) - Number(item.discount || 0))
              return (
                <article className="transaction-item" key={item.id}>
                  <div className="transaction-item__heading">
                    <strong>Barang {index + 1}</strong>
                    {form.items.length > 1 && <Button variant="ghost" size="small" type="button" onClick={() => removeItem(item.id)}><Trash2 size={15} />Hapus</Button>}
                  </div>
                  <label className="transaction-form__field">
                    <span>SKU / produk <b>*</b></span>
                    <select value={item.productId} onChange={(event) => handleProductChange(item.id, event.target.value)} required>
                      <option value="">Pilih produk</option>
                      {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.sku} · {product.name}</option>)}
                      <option value="__new__">+ Buat produk / SKU baru</option>
                    </select>
                  </label>
                  {isNewProduct && (
                    <div className="transaction-form__grid transaction-form__grid--new">
                      <label className="transaction-form__field"><span>Nama produk <b>*</b></span><input value={item.newProductName} onChange={(event) => updateItem(item.id, "newProductName", event.target.value)} required /></label>
                      <label className="transaction-form__field"><span>SKU baru <b>*</b></span><input value={item.newSku} onChange={(event) => updateItem(item.id, "newSku", event.target.value)} required /></label>
                      <label className="transaction-form__field"><span>Harga modal patokan</span><input type="number" min="0" value={item.newCostPrice} onChange={(event) => updateItem(item.id, "newCostPrice", event.target.value)} /></label>
                      <label className="transaction-form__field"><span>Harga jual patokan</span><input type="number" min="0" value={item.newSalePrice} onChange={(event) => updateItem(item.id, "newSalePrice", event.target.value)} /></label>
                    </div>
                  )}
                  {chosenProduct && <p className="transaction-item__sku">SKU: {chosenProduct.sku}</p>}
                  <div className="transaction-form__grid transaction-item__values">
                    <label className="transaction-form__field"><span>Jumlah <b>*</b></span><input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} required /></label>
                    <label className="transaction-form__field"><span>{form.type === "sale" ? "Harga jual per unit" : "Harga beli per unit"} <b>*</b></span><input type="number" min="0" step="1" value={item.unitPrice} onChange={(event) => updateItem(item.id, "unitPrice", event.target.value)} required /></label>
                    <label className="transaction-form__field"><span>Diskon barang (Rp)</span><input type="number" min="0" step="1" value={item.discount} onChange={(event) => updateItem(item.id, "discount", event.target.value)} /></label>
                  </div>
                  <div className="transaction-item__total"><span>Subtotal barang {index + 1}</span><strong>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(lineTotal)}</strong></div>
                </article>
              )
            })}
          </div>
          <div className="transaction-form__grand-total"><span>Total invoice</span><strong>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(invoiceSubtotal)}</strong></div>
        </section>

        {error && <p className="transaction-form__error" role="alert">{error}</p>}
        <div className="transaction-form__actions">
          <Button variant="secondary" type="button" onClick={close} disabled={isSaving}>Batal</Button>
          <Button type="submit" disabled={isSaving}><Plus size={16} />{isSaving ? "Menyimpan..." : "Simpan transaksi"}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default TransactionFormModal
