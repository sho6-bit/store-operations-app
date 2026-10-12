import { useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import Button from "../../components/common/Button"
import Modal from "../../components/common/Modal"

import SearchInput from "../../components/common/SearchInput"
import SummaryCards from "../../components/common/SummaryCards"
import "./inventoryPage.css"

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

function InventoryPage({ data = [], onSaveProduct, onDeleteProduct, businessUnits = defaultBusinessUnits, stockLowThreshold = 1, globalSearchValue = "" }) {
  const [searchTerm, setSearchTerm] = useState("")
  useEffect(() => { setSearchTerm(globalSearchValue) }, [globalSearchValue])
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortMode, setSortMode] = useState("name-asc")
  const [monthFilter, setMonthFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: "", sku: "", category: "", costPrice: "", referencePrice: "", businessUnit: "" })
  const [formError, setFormError] = useState("")
  const [actionError, setActionError] = useState("")
  const products = Array.isArray(data) ? data : []

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))]
  const availableYears = [...new Set(products.map((product) => String(product.createdAt || "").slice(0, 4)).filter((value) => /^\d{4}$/.test(value)))].sort((a, b) => b.localeCompare(a))
  const availableMonths = [...new Set(products.map((product) => String(product.createdAt || "").slice(0, 7)).filter((value) => /^\d{4}-\d{2}$/.test(value)))].sort((a, b) => b.localeCompare(a))
  const hasCostData = products.length > 0 && products.every((product) => product.costPrice != null || product.cost != null)
  const inventoryValue = products.reduce(
    (sum, product) => sum + Math.max(0, Number(product.stock) || 0) * (Number(product.costPrice ?? product.cost) || 0),
    0,
  )
  const lowStockCount = products.filter((product) => {
    const threshold = product.reorderLevel ?? product.minStock ?? stockLowThreshold
    return Number(product.stock) < 0 || (threshold != null && Number(product.stock) > 0 && Number(product.stock) <= Number(threshold))
  }).length
  const outOfStockCount = products.filter((product) => product.stock != null && Number(product.stock) === 0).length

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("id-ID")
    return products.filter((product) => {
      const matchesQuery = !query || [product.name, product.sku, product.category].filter(Boolean).some((value) => String(value).toLocaleLowerCase("id-ID").includes(query))
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      const unitId = product.businessUnitId ?? product.businessUnit
      const matchesUnit = unitFilter === "all" || unitId === unitFilter
      const created = String(product.createdAt || "")
      return matchesQuery && matchesCategory && matchesUnit && (monthFilter === "all" || created.slice(0, 7) === monthFilter) && (yearFilter === "all" || created.slice(0, 4) === yearFilter)
    }).sort((a, b) => {
      const aName = String(a.name || a.sku || "")
      const bName = String(b.name || b.sku || "")
      const aDate = String(a.createdAt || "")
      const bDate = String(b.createdAt || "")
      if (sortMode === "name-desc") return bName.localeCompare(aName, "id", { sensitivity: "base" })
      if (sortMode === "date-asc") return aDate.localeCompare(bDate)
      if (sortMode === "month-desc") return bDate.slice(0, 7).localeCompare(aDate.slice(0, 7))
      if (sortMode === "year-desc") return bDate.slice(0, 4).localeCompare(aDate.slice(0, 4))
      if (sortMode === "date-desc") return bDate.localeCompare(aDate)
      return aName.localeCompare(bName, "id", { sensitivity: "base" })
    })
  }, [products, searchTerm, categoryFilter, unitFilter, sortMode, monthFilter, yearFilter])

  function openProduct(product = null) {
    setEditing(product)
    setForm({ name: product?.name || "", sku: product?.sku || "", category: product?.category || "", costPrice: product?.costPrice ?? product?.cost ?? "", referencePrice: product?.referencePrice ?? product?.price ?? "", businessUnit: product?.businessUnitId ?? product?.businessUnit ?? "" })
    setFormError("")
    setModalOpen(true)
  }

  async function submitProduct(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.sku.trim() || !form.businessUnit || form.costPrice === "" || form.referencePrice === "") {
      setFormError("Nama, SKU, unit usaha, harga modal, dan harga jual patokan wajib diisi.")
      return
    }
    try {
      await onSaveProduct?.({ id: editing?.id, name: form.name.trim(), sku: form.sku.trim(), costPrice: Number(form.costPrice), referencePrice: Number(form.referencePrice), price: Number(form.referencePrice), businessUnit: form.businessUnit, stock: editing?.stock ?? 0, category: form.category.trim(), createdAt: editing?.createdAt || new Date().toISOString() })
      setModalOpen(false)
      setEditing(null)
    } catch (error) { setFormError(error?.message || "Produk gagal disimpan.") }
  }

  async function handleDeleteProduct(product) {
    setActionError("")
    if (!window.confirm("Hapus produk " + product.name + " dari daftar stok? Riwayat transaksi terdahulu tetap tersimpan.")) return
    try {
      if (typeof onDeleteProduct !== "function") throw new Error("Aksi hapus belum tersambung.")
      await onDeleteProduct(product.id)
    } catch (error) { setActionError(error?.message || "Produk gagal dihapus.") }
  }

  function getStockStatus(product) {
    const stock = Number(product.stock)
    const threshold = product.reorderLevel ?? product.minStock ?? stockLowThreshold
    if (product.stock == null || !Number.isFinite(stock)) return null
    if (stock < 0) return { label: "Pre-order " + Math.abs(stock) + " unit", tone: "backorder" }
    if (stock === 0) return { label: "Habis", tone: "out" }
    if (threshold != null && stock <= Number(threshold)) return { label: "Menipis", tone: "low" }
    if (threshold != null) return { label: "Aman", tone: "safe" }
    return null
  }

  return (
    <section className="inventory-page">
      <header className="inventory-page__header">
        <div>
          <span className="inventory-page__eyebrow">INVENTORI</span>
          <h1 className="inventory-page__title">Stok &amp; Produk</h1>
          <p className="inventory-page__description">
            Pantau persediaan, nilai inventori, dan pergerakan stok.
          </p>
        </div>
        <Button onClick={() => openProduct()}><Plus size={16} />Tambah Produk</Button>
      </header>

      <SummaryCards cards={[
        { label: "Total SKU", value: products.length, detail: "Jumlah produk pada data inventori", tone: "blue" },
        { label: "Nilai inventori", value: hasCostData ? formatCurrency(inventoryValue) : "—", detail: "Stok fisik dikali HPP; pre-order tidak dihitung", tone: "green" },
        { label: "Stok menipis", value: lowStockCount, detail: "Batas stok menipis: " + stockLowThreshold + " unit", tone: "orange" },
        { label: "Stok habis", value: products.length ? outOfStockCount : "—", detail: "Produk dengan jumlah stok nol", tone: "purple" },
      ]} />

      <section className="inventory-card" aria-label="Daftar inventaris">
        <div className="inventory-card__toolbar">
          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari produk atau SKU..."
            ariaLabel="Cari produk inventaris"
          />
          <label className="inventory-select">
            <span className="sr-only">Filter kategori</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">Semua kategori</option>
              {categories.map((category) => <option value={category} key={category}>{category}</option>)}
            </select>
          </label>
          <label className="inventory-select">
            <span className="sr-only">Filter unit usaha</span>
            <select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)}>
              <option value="all">Semua unit</option>
              {businessUnits.map((unit) => <option value={unit.id} key={unit.id}>{unit.name}</option>)}
            </select>
          </label>
          <div className="inventory-sort-controls">
            <label><span className="sr-only">Urutkan produk</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value)}><option value="name-asc">Nama A–Z</option><option value="name-desc">Nama Z–A</option><option value="date-desc">Produk terbaru</option><option value="date-asc">Produk terlama</option><option value="month-desc">Bulan terbaru</option><option value="year-desc">Tahun terbaru</option></select></label>
            <label><span className="sr-only">Filter bulan produk dibuat</span><select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}><option value="all">Semua bulan</option>{availableMonths.map((month) => <option key={month} value={month}>{new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(month + "-01T00:00:00"))}</option>)}</select></label>
            <label><span className="sr-only">Filter tahun produk dibuat</span><select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}><option value="all">Semua tahun</option>{availableYears.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          </div>
        </div>

        {actionError && <p className="inventory-action-error" role="alert">{actionError}</p>}

        {filteredProducts.length > 0 ? (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th>Unit Usaha</th>
                  <th>Stok</th>
                  <th>HPP saat ini</th>
                  <th>Harga referensi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const unitId = product.businessUnitId ?? product.businessUnit
                  const unitName = businessUnits.find((unit) => unit.id === unitId)?.name || product.businessUnitName
                  const stockStatus = getStockStatus(product)
                  return (
                    <tr key={product.id}>
                      <td data-label="Produk">
                        <strong>{product.name || "—"}</strong>
                        <span className="inventory-table__sku">{product.sku || "—"}</span>
                      </td>
                      <td data-label="Kategori">{product.category || "—"}</td>
                      <td data-label="Unit usaha">{unitName || "—"}</td>
                      <td className="inventory-table__stock" data-label="Stok">
                        {product.stock ?? "—"}{product.unit ? " " + product.unit : ""}
                      </td>
                      <td data-label="HPP saat ini">{formatCurrency(product.costPrice ?? product.cost)}</td>
                      <td data-label="Harga referensi">{formatCurrency(product.referencePrice ?? product.price)}</td>
                      <td data-label="Status">
                        {stockStatus ? (
                          <span className={"inventory-status inventory-status--" + stockStatus.tone}>
                            {stockStatus.label}
                          </span>
                        ) : "—"}
                      </td>
                      <td data-label="Aksi"><div className="inventory-actions"><button className="inventory-edit-button" type="button" onClick={() => openProduct(product)} aria-label={"Ubah harga " + product.name}><Pencil size={15} />Ubah</button><button className="inventory-delete-button" type="button" onClick={() => handleDeleteProduct(product)} aria-label={"Hapus produk " + product.name} title="Hapus produk"><Trash2 size={15} /></button></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="inventory-empty">
            <strong>{searchTerm || categoryFilter !== "all" || unitFilter !== "all" ? "Produk tidak ditemukan" : "Belum ada data produk"}</strong>
            <span>
              {searchTerm || categoryFilter !== "all" || unitFilter !== "all"
                ? "Sesuaikan pencarian atau filter."
                : "Daftar produk akan tampil di sini setelah data inventaris tersedia."}
            </span>
          </div>
        )}

        <footer className="inventory-card__footer">
          Menampilkan {filteredProducts.length} dari {products.length} produk
        </footer>
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Ubah produk dan harga patokan" : "Tambah produk"} size="medium">
        <form className="transaction-form" onSubmit={submitProduct}>
          <div className="transaction-form__grid">
            <label className="transaction-form__field transaction-form__field--wide"><span>Nama produk <b>*</b></span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className="transaction-form__field"><span>SKU <b>*</b></span><input required value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label>
            <label className="transaction-form__field"><span>Kategori</span><input list="inventory-product-categories" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Pilih atau ketik kategori" /></label>
            <datalist id="inventory-product-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
            <label className="transaction-form__field"><span>Unit usaha <b>*</b></span><select required value={form.businessUnit} onChange={(event) => setForm({ ...form, businessUnit: event.target.value })}><option value="">Pilih unit usaha</option>{businessUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
            <label className="transaction-form__field"><span>Harga modal patokan (Rp) <b>*</b></span><input type="number" min="0" required value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} /></label>
            <label className="transaction-form__field transaction-form__field--wide"><span>Harga jual patokan (Rp) <b>*</b></span><input type="number" min="0" required value={form.referencePrice} onChange={(event) => setForm({ ...form, referencePrice: event.target.value })} /></label>
          </div>
          <p className="transaction-form__hint">Harga patokan dapat diubah kembali melalui tombol Ubah pada baris produk.</p>
          {formError && <p className="transaction-form__error" role="alert">{formError}</p>}
          <div className="transaction-form__actions"><Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Batal</Button><Button type="submit">Simpan produk</Button></div>
        </form>
      </Modal>
    </section>
  )
}

export default InventoryPage

