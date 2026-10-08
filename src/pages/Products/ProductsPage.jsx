import { useMemo, useState } from "react"

import SearchInput from "../../components/common/SearchInput"
import "./productsPage.css"

function formatCurrency(value) {
  if (value === null || value === undefined) return "—"

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function ProductsPage({ data = [] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const products = Array.isArray(data) ? data : []

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return products

    return products.filter((product) =>
      [product.name, product.sku, product.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [products, searchTerm])

  return (
    <section className="products-page">
      <header className="products-page__header">
        <div>
          <span className="products-page__eyebrow">Katalog</span>
          <h1 className="products-page__title">Produk</h1>
          <p className="products-page__description">
            Lihat informasi produk yang tersedia.
          </p>
        </div>
      </header>

      <section className="products-card" aria-label="Daftar produk">
        <div className="products-card__toolbar">
          <div>
            <h2>Daftar produk</h2>
            <p>{products.length} produk</p>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nama, SKU, atau kategori..."
            ariaLabel="Cari produk"
          />
        </div>

        {filteredProducts.length > 0 ? (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Nama produk</th>
                  <th>SKU</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th className="products-table__price-heading">Harga</th>
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
                    <td className="products-table__price">
                      {formatCurrency(product.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="products-empty">
            <strong>
              {searchTerm ? "Produk tidak ditemukan" : "Belum ada data produk"}
            </strong>
            <span>
              {searchTerm
                ? "Periksa kata kunci pencarian."
                : "Produk akan tampil di sini setelah data tersedia."}
            </span>
          </div>
        )}

        <footer className="products-card__footer">
          Menampilkan {filteredProducts.length} dari {products.length} produk
        </footer>
      </section>
    </section>
  )
}

export default ProductsPage