import "./button.css"

export default function Button({
  children,
  variant = "primary",
  size = "medium",
  className = "",
  type = "button",
  disabled = false,
  ...props
}) {
  const classes = [
    "common-button",
    `common-button--${variant}`,
    `common-button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}