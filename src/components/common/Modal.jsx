import { useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import "./modal.css"

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  closeOnOverlay = true,
}) {
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="common-modal-overlay"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) {
          onClose?.()
        }
      }}
    >
      <section
        className={`common-modal common-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
      >
        <header className="common-modal__header">
          <h2 className="common-modal__title">{title}</h2>
          <button
            className="common-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
          >
            <X size={19} />
          </button>
        </header>

        <div className="common-modal__body">{children}</div>
      </section>
    </div>,
    document.body,
  )
}