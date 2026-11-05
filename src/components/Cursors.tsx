/* System-style cursors for the landing demo: white fill, black outline, soft shadow.
   Drawn here so they match macOS/Windows cursors rather than an icon set. */

export function ArrowCursor({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,.35))', overflow: 'visible' }}>
      <path d="M4.5 2.5v16.2l4.1-3.9 2.9 6.5 2.9-1.3-2.9-6.4h5.9z" fill="#fff" stroke="#000" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function GrabCursor({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,.35))', overflow: 'visible' }}>
      <path
        d="M9 15.5v-3c0-2 3-2 3 0v-.5c0-2 3-2 3 0v.3c0-2 3-2 3 0v.7c0-2 3-2 3 0v7c0 4.4-3 7-7 7h-1c-2.3 0-3.9-1-5-2.8l-2.4-4c-.8-1.4.9-2.6 2-1.6l1.4 1.2z"
        fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M12 12.9v3M15 12.6v3.3M18 13.3v2.7" stroke="#000" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
