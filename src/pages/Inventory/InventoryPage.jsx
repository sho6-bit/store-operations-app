import { useMemo, useState } from "react"

import SearchInput from "../../components/common/SearchInput"
import SummaryCards from "../../components/common/SummaryCards"
import "./inventoryPage.css"

const businessUnits = [
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

function InventoryPage({ data = [] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState("all")
  const products = Array.isArray(data) ? data : []

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))]
  const totalStock = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0)
  const hasCostData = products.length > 0 && products.every((product) => product.costPrice != null || product.cost != null)
  const inventoryValue = products.reduce(
    (sum, product) => sum + (Number(product.stock) || 0) * (Number(product.costPrice ?? product.cost) || 0),
    0,
  )
  const hasReorderLevels = products.some((product) => product.reorderLevel != null || product.minStock != null)
  const lowStockCount = products.filter((product) => {
    const threshold = product.reorderLevel ?? product.minStock
    return threshold != null && Number(product.stock) > 0 && Number(product.stock) <= Number(threshold)
  }).length
  const outOfStockCount = products.filter((product) => product.stock != null && Number(product.stock) === 0).length

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return products.filter((product) => {
      const matchesQuery = !query || [product.name, product.sku, product.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      const unitId = product.businessUnitId ?? product.businessUnit
      const matchesUnit = unitFilter === "all" || unitId === unitFilter
      return matchesQuery && matchesCategory && matchesUnit
    })
  }, [products, searchTerm, categoryFilter, unitFilter])

  function getStockStatus(product) {
    const stock = Number(product.stock)
    const threshold = product.reorderLevel ?? product.minStock
    if (product.stock == null || !Number.isFinite(stock)) return null
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
      </header>

      <SummaryCards cards={[
        { label: "Total SKU", value: products.length, detail: "Jumlah produk pada data inventori", tone: "blue" },
        { label: "Nilai inventori", value: hasCostData ? formatCurrency(inventoryValue) : "—", detail: "Dihitung dari stok dan HPP yang tersedia", tone: "green" },
        { label: "Stok menipis", value: hasReorderLevels ? lowStockCount : "—", detail: "Menggunakan batas stok produk", tone: "orange" },
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
        </div>

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
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const unitId = product.businessUnitId ?? product.businessUnit
                  const unitName = businessUnits.find((unit) => unit.id === unitId)?.name || product.businessUnitName
                  const stockStatus = getStockStatus(product)
                  return (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name || "—"}</strong>
                        <span className="inventory-table__sku">{product.sku || "—"}</span>
                      </td>
                      <td>{product.category || "—"}</td>
                      <td>{unitName || "—"}</td>
                      <td className="inventory-table__stock">
                        {product.stock ?? "—"}{product.unit ? " " + product.unit : ""}
                      </td>
                      <td>{formatCurrency(product.costPrice ?? product.cost)}</td>
                      <td>{formatCurrency(product.referencePrice ?? product.price)}</td>
                      <td>
                        {stockStatus ? (
                          <span className={"inventory-status inventory-status--" + stockStatus.tone}>
                            {stockStatus.label}
                          </span>
                        ) : "—"}
                      </td>
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
    </section>
  )
}

export default InventoryPage

