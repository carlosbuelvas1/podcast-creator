const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const HomeIcon = (p) => (
  <svg {...base} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></svg>
)
export const BoardIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="11" rx="1.5" /><rect x="17" y="4" width="4" height="7" rx="1.5" /></svg>
)
export const PlusIcon = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
)
export const CheckIcon = (p) => (
  <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)
export const CalendarIcon = (p) => (
  <svg {...base} {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
)
export const TrashIcon = (p) => (
  <svg {...base} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
)
export const CloseIcon = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const EditIcon = (p) => (
  <svg {...base} {...p}><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
)
export const MicIcon = (p) => (
  <svg {...base} {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" /></svg>
)
export const StepsIcon = (p) => (
  <svg {...base} {...p}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.5" /><circle cx="4.5" cy="12" r="1.5" /><circle cx="4.5" cy="18" r="1.5" /></svg>
)
export const ChevronIcon = (p) => (
  <svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>
)

export const LockIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)

export const DotsIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
)

export const SparkIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    <path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
  </svg>
)

export const GridIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
  </svg>
)

export const LinkIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </svg>
)

export const ThumbUpIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Zm0 0 4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8a2 2 0 0 1-2 1.7H7" />
  </svg>
)

export const ThumbDownIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3Zm0 0-4 8a3 3 0 0 1-3-3v-4H4.5a2 2 0 0 1-2-2.3l1.4-8a2 2 0 0 1 2-1.7H17" />
  </svg>
)
export const StarIcon = (p) => (
  <svg {...base} {...p}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" /></svg>
)
