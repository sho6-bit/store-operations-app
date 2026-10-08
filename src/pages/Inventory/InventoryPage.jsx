import { useMemo, useState } from "react"

import SearchInput from "../../components/common/SearchInput"
import "./inventoryPage.css"

function formatCurrency(value) {
  if (value === null || value === undefined) return "—"

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function Inventory({ data = [] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const products = Array.isArray(data) ? data : []

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return products

    return products.filter((product) =>
      [
        product.name,
        product.sku,
        product.category,
        product.unit,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [products, searchTerm])

  return (
    <section className="inventory-page">
      <header className="inventory-page__header">
        <div>
          <span className="inventory-page__eyebrow">Produk</span>
          <h1 className="inventory-page__title">Inventaris</h1>
          <p className="inventory-page__description">
            Lihat daftar produk dan jumlah stok yang tercatat.
          </p>
        </div>
      </header>

      <section className="inventory-card" aria-label="Daftar inventaris">
        <div className="inventory-card__toolbar">
          <div>
            <h2>Daftar produk</h2>
            <p>{products.length} produk</p>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nama, SKU, atau kategori..."
            ariaLabel="Cari produk inventaris"
          />
        </div>

        {filteredProducts.length > 0 ? (
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>SKU</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Harga</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name || "—"}</strong>
                    </td>
                    <td>{product.sku || "—"}</td>
                    <td>{product.category || "—"}</td>
                    <td>
                      {product.stock ?? "—"}
                      {product.unit ? ` ${product.unit}` : ""}
                    </td>
                    <td>{formatCurrency(product.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="inventory-empty">
            <strong>
              {searchTerm ? "Produk tidak ditemukan" : "Belum ada data produk"}
            </strong>
            <span>
              {searchTerm
                ? "Periksa kata kunci pencarian."
                : "Produk akan tampil di sini setelah data inventaris tersedia."}
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

export default Inventory