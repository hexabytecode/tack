import { useEffect, useRef } from 'react'
import { Bug, ChevronsUp, ChevronUp, ChevronDown, Circle, CircleCheck, CircleDashed, CircleDot, SquareCheck, type LucideIcon } from 'lucide-react'
import { Avatar as UIAvatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { STATUSES, type Issue, type IssueType, type Priority, type Status, type User } from '../data/mock'

export const cx = cn

/* ── Logo ─────────────────────────────────────────────────────────────
   Monoline lettering drawn with the same 3.5 stroke as the mark, so the
   "t" in the wordmark is the mark itself. Full logo for wide spaces,
   the mark alone for tight ones (favicon, phone header, avatars). */
const INK = '#000'
const BLUE = '#183FD9'

export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn('shrink-0', className)}>
      <circle cx="10" cy="4.5" r="3.5" fill={BLUE} />
      <path d="M10 8.5V17c0 1.66 1.34 3 3 3h3.5" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10.5H15" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

export function Wordmark({ height = 24, className, label = 'Tack' }: { height?: number; className?: string; label?: string }) {
  return (
    <svg height={height} width={(height * 64) / 24} viewBox="0 0 64 24" fill="none" role="img" aria-label={label} className={cn('shrink-0', className)}>
      <circle cx="10" cy="4.5" r="3.5" fill={BLUE} />
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 8.5V17c0 1.66 1.34 3 3 3h3.5" />
        <path d="M5.5 10.5H15" />
        {/* a */}
        <circle cx="26.5" cy="14.8" r="4.9" />
        <path d="M31.4 10v10" />
        {/* c */}
        <path d="M45.6 11.4a4.9 4.9 0 1 0 0 6.8" />
        {/* k */}
        <path d="M51.5 3.5V20" />
        <path d="M58.6 10.2 52.6 15.6" />
        <path d="M54.8 13.9 59 20" />
      </g>
    </svg>
  )
}

export function Logo({ sub, size = 'md' }: { sub?: string; size?: 'sm' | 'md' | 'lg' }) {
  const h = size === 'lg' ? 30 : size === 'sm' ? 20 : 24
  return (
    <span className="flex flex-col items-start gap-1.5">
      <Wordmark height={h} />
      {sub && <span className="font-mono text-[10px] uppercase leading-none tracking-[0.06em] text-slate">{sub}</span>}
    </span>
  )
}

/* ── People ───────────────────────────────────────────────────────── */
const TONES = ['#E8ECFB', '#FBEDE6', '#E6F4EE', '#F4ECFA', '#FBF4E2', '#EAF2F8']
export function Avatar({ user, size = 22, className }: { user?: User; size?: number; className?: string }) {
  const tone = user ? TONES[user.name.charCodeAt(0) % TONES.length] : '#EEEEF2'
  return (
    <UIAvatar title={user?.name ?? 'Unassigned'} className={cn('shrink-0 border border-line', className)} style={{ width: size, height: size }}>
      <AvatarFallback className="font-mono font-medium text-ink" style={{ background: tone, fontSize: size < 24 ? 9.5 : 11 }}>
        {user ? user.initials : '–'}
      </AvatarFallback>
    </UIAvatar>
  )
}

/* ── Status, type and priority ──────────────────────────────────────
   Each gets its own icon and colour, so a card reads at a glance. */
export const statusMeta = (s: Status) => STATUSES.find(x => x.id === s)!
export const STATUS_ICON: Record<Status, LucideIcon> = { todo: Circle, progress: CircleDashed, review: CircleDot, done: CircleCheck }

export function StatusIcon({ status, className }: { status: Status; className?: string }) {
  const I = STATUS_ICON[status]
  return <I className={cn('size-3.5 shrink-0 transition-colors duration-200', className)} style={{ color: statusMeta(status).color }} strokeWidth={2.25} aria-hidden="true" />
}

export function StatusDot({ status, size = 8 }: { status: Status; size?: number }) {
  return <span className="inline-block shrink-0 rounded-full transition-colors duration-200" style={{ width: size, height: size, background: statusMeta(status).color }} />
}

export function StatusLabel({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: statusMeta(status).color }}>
      <StatusIcon status={status} />
      {statusMeta(status).label}
    </span>
  )
}

export const TYPE_META: Record<IssueType, { label: string; icon: LucideIcon; cls: string; iconCls: string }> = {
  task: { label: 'Task', icon: SquareCheck, cls: 'border-[#C9D3F6] bg-[#F1F4FD] text-brand', iconCls: 'text-brand' },
  bug: { label: 'Bug', icon: Bug, cls: 'border-[#F5C9C9] bg-[#FDF1F1] text-[#B42318]', iconCls: 'text-[#D92D20]' },
}

export const PRIORITY_META: Record<Priority, { label: string; short: string; icon: LucideIcon; cls: string; iconCls: string }> = {
  high: { label: 'High', short: 'High', icon: ChevronsUp, cls: 'border-[#F5C9C9] bg-[#FDF1F1] text-[#B42318]', iconCls: 'text-[#D92D20]' },
  medium: { label: 'Medium', short: 'Med', icon: ChevronUp, cls: 'border-[#F3DDB8] bg-[#FDF6EA] text-[#93500A]', iconCls: 'text-warning' },
  low: { label: 'Low', short: 'Low', icon: ChevronDown, cls: 'border-line bg-wash text-slate', iconCls: 'text-slate' },
}

export function TypeBadge({ type, compact }: { type: IssueType; compact?: boolean }) {
  const m = TYPE_META[type]
  return (
    <Badge variant="outline" className={cn('h-[20px] gap-1 rounded-[4px] px-1.5 font-mono text-[10.5px] font-medium', m.cls)}>
      <m.icon className={cn('!size-3', m.iconCls)} strokeWidth={2.25} />
      {!compact && m.label}
    </Badge>
  )
}

export function PriorityBadge({ priority, compact }: { priority: Priority; compact?: boolean }) {
  const m = PRIORITY_META[priority]
  return (
    <Badge variant="outline" className={cn('h-[20px] gap-0.5 rounded-[4px] px-1.5 font-mono text-[10.5px] font-medium', m.cls)} title={`${m.label} priority`}>
      <m.icon className={cn('!size-3', m.iconCls)} strokeWidth={2.5} />
      {!compact && m.short}
    </Badge>
  )
}

export function IssueChips({ issue, compact }: { issue: Issue; compact?: boolean }) {
  return (
    <>
      <TypeBadge type={issue.type} compact={compact} />
      <PriorityBadge priority={issue.priority} compact={compact} />
    </>
  )
}

/* ── Time ─────────────────────────────────────────────────────────── */
export function timeAgo(at: number) {
  const s = Math.max(1, Math.round((Date.now() - at) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60); if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24); if (d < 7) return `${d}d ago`
  return `${Math.round(d / 7)}w ago`
}

export function dueLabel(due: string | null) {
  if (!due) return null
  const d = new Date(due + 'T12:00:00')
  const today = new Date(); today.setHours(12, 0, 0, 0)
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  const text = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return { text, overdue: days < 0, soon: days >= 0 && days <= 2 }
}

/* ── Scroll reveal ────────────────────────────────────────────────── */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets = [el, ...Array.from(el.querySelectorAll<HTMLElement>('.reveal, .illo'))]
    if (!('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('in')); return }
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    targets.forEach(t => io.observe(t))
    return () => io.disconnect()
  }, [])
  return ref
}

export function issueMarkdown(issue: Issue, assignee?: User) {
  return [
    `# ${issue.key}: ${issue.title}`,
    '',
    `- Status: ${statusMeta(issue.status).label}`,
    `- Type: ${TYPE_META[issue.type].label}`,
    `- Priority: ${PRIORITY_META[issue.priority].label}`,
    `- Assignee: ${assignee?.name ?? 'Unassigned'}`,
    issue.due ? `- Due: ${issue.due}` : null,
    issue.labels.length ? `- Labels: ${issue.labels.join(', ')}` : null,
    '',
    issue.description || '_No description yet._',
  ].filter(l => l !== null).join('\n')
}

/* Tinted pill for statuses: colour, icon and label together, so a status never reads as plain text. */
export const STATUS_PILL: Record<Status, string> = {
  todo: 'border-line bg-[#F3F4F7] text-slate',
  progress: 'border-[#C9D3F6] bg-[#EEF2FD] text-brand',
  review: 'border-[#F3DDB8] bg-[#FDF6EA] text-[#93500A]',
  done: 'border-[#BFE3D0] bg-[#EAF6EF] text-success',
}
export function StatusPill({ status, className, size = 'md' }: { status: Status; className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap', size === 'sm' ? 'h-[20px] px-2 text-[11px]' : 'h-6 px-2.5 text-[12px]', STATUS_PILL[status], className)}>
      <StatusIcon status={status} className={size === 'sm' ? 'size-3' : 'size-3.5'} />
      {statusMeta(status).label}
    </span>
  )
}
