import { forwardRef, type HTMLAttributes } from 'react'
import { Bot, CalendarClock, MessageSquare } from 'lucide-react'
import type { Issue, User } from '../data/mock'
import { Avatar, IssueChips, cx, dueLabel } from '@/lib/ui'

type Props = HTMLAttributes<HTMLDivElement> & {
  issue: Issue; assignee?: User; lifted?: boolean; flash?: boolean; ghost?: boolean; byAgent?: boolean; comments?: number
}

/* No tilt while dragging: the card lifts with a black edge and a soft shadow, and grows a touch. */
const IssueCard = forwardRef<HTMLDivElement, Props>(function IssueCard({ issue, assignee, lifted, flash, ghost, byAgent, comments = 0, className, ...rest }, ref) {
  const due = dueLabel(issue.due)
  return (
    <div
      ref={ref}
      {...rest}
      className={cx(
        'group relative cursor-grab select-none rounded-[4px] border bg-paper p-3 text-left transition-[border-color,box-shadow,transform,opacity] duration-150 active:cursor-grabbing',
        lifted ? 'scale-[1.02] border-ink shadow-[0_12px_28px_rgba(0,0,0,.14)]' : 'border-line hover:border-slate/50 hover:shadow-[0_1px_2px_rgba(0,0,0,.04)]',
        ghost && 'border-dashed bg-wash opacity-50 [&>*]:invisible',
        flash && 'flash',
        className,
      )}
    >
      {byAgent && (
        <span className="anim-rise mb-1.5 inline-flex items-center gap-1 rounded-[3px] border border-brand bg-paper px-1 py-px font-mono text-[9.5px] uppercase tracking-[0.04em] text-brand">
          <Bot className="size-3" />By agent · Claude
        </span>
      )}
      <p className={cx('line-clamp-2 text-[13.5px] font-medium leading-snug', issue.status === 'done' && 'text-slate')}>{issue.title}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11.5px] text-slate">{issue.key}</span>
          <IssueChips issue={issue} />
        </div>
        <Avatar user={assignee} />
      </div>
      {(comments > 0 || (due && issue.status !== 'done')) && (
        <div className="mt-2.5 flex items-center gap-3 border-t border-line pt-2 font-mono text-[10.5px] text-slate">
          {due && issue.status !== 'done' && (
            <span className={cx('inline-flex items-center gap-1', due.overdue && 'text-[#B42318]', due.soon && !due.overdue && 'text-warning')}>
              <CalendarClock className="size-3" />{due.overdue ? `Overdue · ${due.text}` : due.text}
            </span>
          )}
          {comments > 0 && <span className="inline-flex items-center gap-1"><MessageSquare className="size-3" />{comments}</span>}
        </div>
      )}
    </div>
  )
})

export default IssueCard
