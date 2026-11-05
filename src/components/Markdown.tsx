import { Children, isValidElement, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Info, Lightbulb, type LucideIcon } from 'lucide-react'
import { useStore } from '../store'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

/* Callouts use the GitHub-style "> [!NOTE]" syntax so the text stays plain Markdown. */
const CALLOUTS: Record<string, { icon: LucideIcon; label: string; cls: string; iconCls: string }> = {
  NOTE: { icon: Info, label: 'Note', cls: 'border-[#C9D3F6] bg-[#F1F4FD]', iconCls: 'text-brand' },
  TIP: { icon: Lightbulb, label: 'Tip', cls: 'border-[#BFE3D0] bg-[#EEF8F2]', iconCls: 'text-success' },
  WARNING: { icon: AlertTriangle, label: 'Heads up', cls: 'border-[#F3DDB8] bg-[#FDF6EA]', iconCls: 'text-warning' },
  DONE: { icon: CheckCircle2, label: 'Decision', cls: 'border-line bg-wash', iconCls: 'text-ink' },
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

/* Turn "@Samira" and "WEB-142" into links the renderer shows as badges. */
function decorate(src: string, names: { first: string; id: string }[]) {
  let out = src.replace(/(^|[\s(])@([A-Z][a-z]+)/g, (m, pre, first) => {
    const u = names.find(n => n.first.toLowerCase() === first.toLowerCase())
    return u ? `${pre}[@${first}](mention:${u.id})` : m
  })
  out = out.replace(/(^|[\s(])\b((?:WEB|APP|BO)-\d+)\b(?!\])/g, (_m, pre, key) => `${pre}[${key}](issue:${key})`)
  return out
}

export default function Markdown({ children, className }: { children: string; className?: string }) {
  const { state } = useStore()
  const [, setParams] = useSearchParams()
  const names = state.users.map(u => ({ first: u.name.split(' ')[0], id: u.id }))

  return (
    <div className={cn('md text-[13.5px] leading-relaxed', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={u => u}
        components={{
          a: ({ href = '', children: c }) => {
            if (href.startsWith('mention:')) {
              const u = state.users.find(x => x.id === href.slice(8))
              return <span className="inline-flex items-center rounded-[4px] bg-[#E8ECFB] px-1 py-px font-medium text-brand" title={u?.name}>{c}</span>
            }
            if (href.startsWith('issue:')) {
              const key = href.slice(6)
              return (
                <button type="button" onClick={() => setParams(p => { p.set('issue', key); return p })}
                  className="inline-flex items-center rounded-[4px] border border-line bg-wash px-1 font-mono text-[12px] text-ink hover:border-ink">{c}</button>
              )
            }
            return <a href={href} target="_blank" rel="noreferrer" className="text-ink underline decoration-line underline-offset-2 hover:decoration-ink">{c}</a>
          },
          blockquote: ({ children: c }) => {
            const kids = Children.toArray(c).filter(k => !(typeof k === 'string' && !k.trim()))
            const first = textOf(kids[0])
            const m = first.match(/^\s*\[!(NOTE|TIP|WARNING|DONE)\]\s*/)
            if (m) {
              const meta = CALLOUTS[m[1]]
              const body = first.replace(m[0], '')
              return (
                <div className={cn('my-2 flex gap-2.5 rounded-[4px] border px-3 py-2.5', meta.cls)}>
                  <meta.icon className={cn('mt-0.5 size-4 shrink-0', meta.iconCls)} />
                  <div className="min-w-0">
                    <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-slate">{meta.label}</div>
                    <div>{body}</div>
                    {kids.slice(1)}
                  </div>
                </div>
              )
            }
            return <blockquote className="my-2 border-l-2 border-line pl-3 text-slate">{c}</blockquote>
          },
          code: ({ children: c, className: lang }) => lang
            ? <code className="block overflow-x-auto rounded-[4px] bg-ink px-3 py-2 font-mono text-[12px] text-brand-soft">{c}</code>
            : <code className="rounded-[3px] bg-cloud px-1 py-px font-mono text-[12px]">{c}</code>,
          pre: ({ children: c }) => <pre className="my-2">{c}</pre>,
          ul: ({ children: c, className: k }) => <ul className={cn('my-1.5 flex flex-col gap-0.5', k?.includes('contains-task-list') ? 'pl-0' : 'list-disc pl-5')}>{c}</ul>,
          ol: ({ children: c }) => <ol className="my-1.5 flex list-decimal flex-col gap-0.5 pl-5">{c}</ol>,
          li: ({ children: c, className: k }) => <li className={cn(k?.includes('task-list-item') && 'flex list-none items-start gap-2')}>{c}</li>,
          input: ({ checked }) => <Checkbox checked={!!checked} disabled className="mt-1 disabled:cursor-default disabled:opacity-100 data-[state=checked]:border-brand data-[state=checked]:bg-brand" />,
          p: ({ children: c }) => <p className="my-1">{c}</p>,
          h1: ({ children: c }) => <h4 className="mb-1 mt-3 text-[15px] font-medium">{c}</h4>,
          h2: ({ children: c }) => <h4 className="mb-1 mt-3 text-[14px] font-medium">{c}</h4>,
          h3: ({ children: c }) => <h4 className="mb-1 mt-2 text-[13.5px] font-medium">{c}</h4>,
          strong: ({ children: c }) => <strong className="font-semibold">{c}</strong>,
        }}
      >
        {decorate(children, names)}
      </ReactMarkdown>
    </div>
  )
}
