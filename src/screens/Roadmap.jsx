import Sheet from '../Sheet'
import { ROADMAP, ROADMAP_STATUS } from '../roadmap'
import { t } from '../i18n'

export default function Roadmap({ onClose }) {
  return (
    <Sheet title={t('Hoja de ruta')} onClose={onClose}>
      <p className="muted">{t('Lo que viene para Podcast Creator.')}</p>
      {ROADMAP_STATUS.map((s) => (
        <section key={s.id} className="sheet-section roadmap-group">
          <h3 className="card-title">{t(s.label)}</h3>
          <ul className="roadmap-list">
            {ROADMAP.filter((r) => r.status === s.id).map((r) => (
              <li key={r.title} className={`roadmap-item ${s.id}`}>
                {t(r.title)}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Sheet>
  )
}
