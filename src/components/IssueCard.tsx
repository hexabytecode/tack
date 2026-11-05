import { forwardRef, type HTMLAttributes } from 'react'
import type { Issue, User } from '../data/mock'
import { Avatar, IssueChips, cx, dueLabel } from '../lib/ui'

type Props = HTMLAttributes<HTMLDivElement> & { issue: Issue; assignee?: User; lifted?: boolean; flash?: boolean; ghost?: boolean; byAgent?: boolean }

const IssueCard = forwardRef<HTMLDivElement, Props>(function IssueCard({ issue, assignee, lifted, flash, ghost, byAgent, className, ...rest }, ref) {
  const due = dueLabel(issue.due)
  return (
    <div
      ref={ref}
      {...rest}
      className={cx(
        'group cursor-pointer select-none rounded-[4px] border bg-paper p-3 text-left transition-[border-color,box-shadow] duration-150',
        lifted ? 'rotate-[-1.5deg] border-ink shadow-[0_8px_24px_rgba(0,0,0,.12)]' : 'border-line hover:border-slate/50',
        ghost && 'opacity-40',
        flash && 'flash',
        className,
      )}
    >
      {byAgent && <span className="anim-rise mb-1.5 inline-flex rounded-[3px] border border-accent bg-paper px-1 font-mono text-[9.5px] uppercase tracking-[0.04em] text-accent">By agent · Claude</span>}
      <p className={cx('line-clamp-2 text-[13.5px] font-medium leading-snug', issue.status === 'done' && 'text-slate')}>{issue.title}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="font-mono text-[11.5px] text-slate">{issue.key}</span>
          <IssueChips issue={issue} />
          {due && issue.status !== 'done' && (
            <span className={cx('hidden font-mono text-[10.5px] xl:inline', due.overdue ? 'text-warning' : 'text-slate')}>{due.text}</span>
          )}
        </div>
        <Avatar user={assignee} />
      </div>
    </div>
  )
})

export default IssueCard
