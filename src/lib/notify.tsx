import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Bot, Check, ClipboardCheck, Info, Plus, X } from 'lucide-react'
import type { Status } from '../data/mock'
import { StatusPill } from './ui'

export type NotifyKind = 'info' | 'success' | 'create' | 'copy' | 'agent' | 'status'
export type NotifyOptions = { kind?: NotifyKind; description?: ReactNode; status?: Status; action?: { label: string; onClick: () => void } }

const ICONS = { info: Info, success: Check, create: Plus, copy: ClipboardCheck, agent: Bot, status: Check }
const TONES: Record<NotifyKind, string> = {
  info: 'bg-white/10 text-white', success: 'bg-[#1A7A52] text-white', create: 'bg-brand text-white',
  copy: 'bg-white/10 text-white', agent: 'bg-brand text-white', status: 'bg-white/10 text-white',
}

/* Tack notifications: black card, a coloured icon, the message, optional detail (issue key, status) and an action. */
export function notify(title: string, opts: NotifyOptions = {}) {
  const kind = opts.kind ?? (opts.status ? 'status' : 'info')
  const I = ICONS[kind]
  toast.custom(id => (
    <div className="pointer-events-auto flex w-[360px] max-w-[calc(100vw-32px)] items-start gap-3 rounded-[6px] bg-ink px-3.5 py-3 text-paper shadow-[0_12px_32px_rgba(0,0,0,.28)]">
      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${TONES[kind]}`}><I className="size-3.5" strokeWidth={2.25} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium leading-snug">{title}</div>
        {(opts.description || opts.status) && (
          <div className="mt-1.5 flex min-w-0 items-center gap-2">
            {opts.status && <StatusPill status={opts.status} size="sm" />}
            {opts.description && <span className="truncate text-[12.5px] text-[#B6BACB]">{opts.description}</span>}
          </div>
        )}
      </div>
      {opts.action && (
        <button onClick={() => { opts.action!.onClick(); toast.dismiss(id) }}
          className="shrink-0 rounded-[4px] border border-white/20 px-2 py-1 text-[12px] font-medium text-white transition-colors hover:border-white hover:bg-white/10">
          {opts.action.label}
        </button>
      )}
      <button aria-label="Dismiss" onClick={() => toast.dismiss(id)} className="shrink-0 rounded-[3px] p-0.5 text-[#8E93A8] hover:text-white"><X className="size-3.5" /></button>
    </div>
  ), { duration: opts.action ? 5000 : 3200 })
}
