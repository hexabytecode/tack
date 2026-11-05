import { useStore } from '../store'

export default function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className="anim-rise rounded-[4px] bg-ink px-3 py-2 font-mono text-[12px] text-paper shadow-[0_8px_24px_rgba(0,0,0,.12)]">
          {t.text}
        </div>
      ))}
    </div>
  )
}
