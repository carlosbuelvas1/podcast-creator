import { useEffect, useRef } from 'react'
import { CloseIcon } from './icons'

export default function Sheet({ title, onClose, children, full = false, actions = null }) {
  const closeRef = useRef(onClose)
  const sheetRef = useRef(null)
  const drag = useRef(null)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    document.body.classList.add('locked')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('locked')
    }
  }, [])

  const onTouchStart = (e) => {
    drag.current = { y: e.touches[0].clientY, dy: 0 }
  }
  const onTouchMove = (e) => {
    if (!drag.current || !sheetRef.current) return
    drag.current.dy = Math.max(0, e.touches[0].clientY - drag.current.y)
    sheetRef.current.style.transform = `translateY(${drag.current.dy}px)`
  }
  const onTouchEnd = () => {
    if (!drag.current || !sheetRef.current) return
    const { dy } = drag.current
    drag.current = null
    sheetRef.current.style.transform = ''
    if (dy > 110) onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        ref={sheetRef}
        className={`sheet ${full ? 'full' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <span className="grabber" aria-hidden="true" />
          <h2>{title}</h2>
          <div className="sheet-head-actions">
            {actions}
            <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
              <CloseIcon />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Segmented({ options, value, onChange, name }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          className={`${value === o.value ? 'on' : ''} ${o.className ?? ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
