import { LANGS, getLang, setLang, t } from './i18n'

export default function LangToggle() {
  const lang = getLang()
  return (
    <div className="lang-toggle" role="group" aria-label={t('Idioma')}>
      {LANGS.map((l) => (
        <button key={l} type="button" className={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l === 'es' ? 'Español' : 'English'}
        </button>
      ))}
    </div>
  )
}
