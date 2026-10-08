import { TrendingUp } from "lucide-react"
import "./statCard.css"

export default function StatCard({
  label,
  value,
  change,
  detail,
  icon: Icon,
  tone = "purple",
  trend = "up",
}) {
  return (
    <article className="common-stat-card">
      <div className={`common-stat-card__icon common-stat-card__icon--${tone}`}>
        {Icon ? <Icon size={19} aria-hidden="true" /> : null}
      </div>

      <p className="common-stat-card__label">{label}</p>
      <div className="common-stat-card__value-row">
        <strong className="common-stat-card__value">{value}</strong>
      </div>

      {(change || detail) && (
        <p className="common-stat-card__footer">
          {change && (
            <span className={`common-stat-card__change common-stat-card__change--${trend}`}>
              {trend === "up" && <TrendingUp size={13} aria-hidden="true" />}
              {change}
            </span>
          )}
          {detail && <span>{detail}</span>}
        </p>
      )}
    </article>
  )
}