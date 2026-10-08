import "./summaryCards.css"

function SummaryCards({ cards }) {
  if (!Array.isArray(cards) || cards.length === 0) return null
  return (
    <section className="page-summary-cards" aria-label="Ringkasan halaman">
      {cards.map((card) => (
        <article className={"page-summary-card page-summary-card--" + (card.tone || "blue")} key={card.label}>
          <span className="page-summary-card__label">{card.label}</span>
          <strong className="page-summary-card__value">{card.value ?? "—"}</strong>
          {card.detail && <span className="page-summary-card__detail">{card.detail}</span>}
        </article>
      ))}
    </section>
  )
}

export default SummaryCards
