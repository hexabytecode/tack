import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { STATUSES, type Issue, type Priority, type Status, type User } from '../data/mock'

export function cx(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(' ') }

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="10" cy="4.5" r="3.5" fill="#183FD9" />
      <path d="M10 8.5V17c0 1.66 1.34 3 3 3h3.5" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10.5H15" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ sub }: { sub?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span>
        <span className="block text-[18px] font-medium leading-none tracking-tight">Tack</span>
        {sub && <span className="mt-1 block font-mono text-[10px] uppercase leading-none text-slate">{sub}</span>}
      </span>
    </span>
  )
}

export function Icon({ name, className, fill }: { name: string; className?: string; fill?: boolean }) {
  return <span className={cx('icon', className)} style={fill ? { fontVariationSettings: '"FILL" 1, "opsz" 20' } : undefined} aria-hidden="true">{name}</span>
}

export function Avatar({ user, size = 22 }: { user?: User; size?: number }) {
  return (
    <span
      title={user?.name ?? 'Unassigned'}
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-cloud font-mono font-medium text-ink"
      style={{ width: size, height: size, fontSize: size < 24 ? 9.5 : 11 }}
    >
      {user ? user.initials : <Icon name="person" className="!text-[13px] text-slate" />}
    </span>
  )
}

export const statusMeta = (s: Status) => STATUSES.find(x => x.id === s)!

export function StatusDot({ status, size = 8 }: { status: Status; size?: number }) {
  return <span className="inline-block shrink-0 rounded-full transition-colors duration-200" style={{ width: size, height: size, background: statusMeta(status).color }} />
}

export function StatusLabel({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: statusMeta(status).color }}>
      <StatusDot status={status} />
      {statusMeta(status).label}
    </span>
  )
}

export function Chip({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return (
    <span className={cx('inline-flex h-[18px] items-center rounded-[3px] border px-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.04em]', strong ? 'border-ink text-ink' : 'border-line text-slate')}>
      {children}
    </span>
  )
}

export const priorityLabel: Record<Priority, string> = { high: 'High', medium: 'Med', low: 'Low' }

export function IssueChips({ issue }: { issue: Issue }) {
  return (
    <>
      <Chip strong={issue.type === 'bug'}>{issue.type}</Chip>
      <Chip strong={issue.priority === 'high'}>{priorityLabel[issue.priority]}</Chip>
    </>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm' | 'md' }
export function Button({ variant = 'primary', size = 'md', className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[4px] border font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'md' ? 'h-[34px] px-3.5 text-[13px]' : 'h-7 px-2.5 text-[12.5px]',
        variant === 'primary' && 'border-ink bg-ink text-paper hover:border-accent hover:bg-accent',
        variant === 'secondary' && 'border-line bg-cloud text-ink hover:border-ink',
        variant === 'ghost' && 'border-transparent bg-transparent text-ink hover:underline',
        className,
      )}
    />
  )
}

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

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets = [el, ...Array.from(el.querySelectorAll<HTMLElement>('.reveal'))]
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
    `- Type: ${issue.type}`,
    `- Priority: ${issue.priority}`,
    `- Assignee: ${assignee?.name ?? 'Unassigned'}`,
    issue.due ? `- Due: ${issue.due}` : null,
    issue.labels.length ? `- Labels: ${issue.labels.join(', ')}` : null,
    '',
    issue.description || '_No description yet._',
  ].filter(l => l !== null).join('\n')
}
