function formatThousands(value) {
  const digits = String(value ?? "").replace(/\D/g, "")
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function NumberInput({ value, onChange, min, required, disabled, placeholder, ...props }) {
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatThousands(value)}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
      aria-valuemin={min}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
    />
  )
}

export default NumberInput
