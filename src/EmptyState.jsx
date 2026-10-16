export function EmptyState({ icon: Icon, text, action, onAction }) {
  const run = onAction ?? (() => {
    const input = document.querySelector('.quick-add input')
    input?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    input?.focus({ preventScroll: true })
  })
  return (
    <div className="card empty-state">
      {Icon && <Icon width={32} height={32} className="empty-icon" aria-hidden="true" />}
      <p>{text}</p>
      {action && (
        <button type="button" className="btn primary" onClick={run}>
          {action}
        </button>
      )}
    </div>
  )
}
