import "./settingsPage.css"

function SettingsPage() {
  return (
    <section className="setting-page">
      <header className="setting-page__header">
        <div>
          <span className="setting-page__eyebrow">Aplikasi</span>
          <h1 className="setting-page__title">Pengaturan</h1>
          <p className="setting-page__description">
            Kelola pengaturan operasional toko.
          </p>
        </div>
      </header>

      <section className="setting-card" aria-label="Pengaturan aplikasi">
        <div className="setting-empty">
          <strong>Pengaturan belum tersedia</strong>
          <span>
            Bagian ini dapat diisi setelah pilihan pengaturan dan sumber datanya
            ditentukan.
          </span>
        </div>
      </section>
    </section>
  )
}

export default SettingsPage