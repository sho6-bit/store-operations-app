import { Search, X } from "lucide-react"
import "./searchInput.css"

export default function SearchInput({
  value,
  onChange,
  placeholder = "Cari...",
  ariaLabel = "Cari",
  className = "",
  ...props
}) {
  return (
    <label className={`common-search ${className}`.trim()}>
      <Search className="common-search__icon" size={17} aria-hidden="true" />
      <input
        className="common-search__input"
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        {...props}
      />
      {value && (
        <button
          className="common-search__clear"
          type="button"
          aria-label="Hapus pencarian"
          onClick={() => onChange?.({ target: { value: "" } })}
        >
          <X size={15} />
        </button>
      )}
    </label>
  )
}