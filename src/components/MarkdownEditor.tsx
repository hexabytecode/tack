import { useRef, useState } from 'react'
import { AtSign, Bold, Eye, ListChecks, MessageSquareWarning, PenLine } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import Markdown from './Markdown'
import { Avatar } from '@/lib/ui'
import { cn } from '@/lib/utils'
import type { User } from '../data/mock'

type Props = {
  id: string
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
  submitLabel?: string
  placeholder?: string
  people: User[]
  rows?: number
  onCancel?: () => void
  /** Start open (for editing an existing description). Comment boxes start as one quiet line. */
  open?: boolean
}

/* A quiet box: one line until you click in. Then four tools (bold, checklist, callout, mention),
   a preview toggle and the submit button. Markdown still works if you type it. */
export default function MarkdownEditor({ id, value, onChange, onSubmit, submitLabel = 'Comment', placeholder = 'Leave a comment…', people, rows = 3, onCancel, open = false }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(open)
  const [preview, setPreview] = useState(false)
  const [mention, setMention] = useState(false)
  const expanded = focused || open || !!value || preview

  const apply = (before: string, after = '', block = false, fallback = '') => {
    const el = ref.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    const picked = value.slice(s, e) || fallback
    const prefix = block && s > 0 && value[s - 1] !== '\n' ? '\n' : ''
    onChange(value.slice(0, s) + prefix + before + picked + after + value.slice(e))
    requestAnimationFrame(() => {
      el.focus()
      const pos = s + prefix.length + before.length
      el.setSelectionRange(pos, pos + picked.length)
    })
  }

  const tool = 'size-7 text-slate hover:text-ink'

  return (
    <div className={cn('rounded-[6px] border bg-paper transition-[border-color,box-shadow] duration-150',
      expanded ? 'border-line focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/15' : 'border-line hover:border-slate/40')}>
      {preview ? (
        <div className="min-h-[76px] px-3 py-2.5">{value.trim() ? <Markdown>{value}</Markdown> : <p className="text-[13.5px] text-placeholder/70">Nothing to preview yet.</p>}</div>
      ) : (
        <Textarea
          id={id}
          ref={ref}
          value={value}
          rows={expanded ? rows : 1}
          onFocus={() => setFocused(true)}
          onBlur={e => { if (!e.currentTarget.closest('[data-editor]')?.contains(e.relatedTarget as Node)) setFocused(false) }}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit?.() } }}
          placeholder={placeholder}
          className={cn('resize-none rounded-[6px] border-0 bg-transparent px-3 text-[13.5px] shadow-none placeholder:text-placeholder/70 focus-visible:border-0 focus-visible:ring-0',
            expanded ? 'min-h-[76px] py-2.5' : 'min-h-0 py-2')}
        />
      )}
      {expanded && (
        <div data-editor className="anim-fade flex items-center justify-between gap-2 border-t border-line px-1.5 py-1.5" onMouseDown={e => e.preventDefault()}>
          <div className="flex items-center gap-0.5">
            <Tooltip><TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" className={tool} onClick={() => apply('**', '**', false, 'bold text')} aria-label="Bold" disabled={preview}><Bold /></Button>
            </TooltipTrigger><TooltipContent>Bold</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" className={tool} onClick={() => apply('- [ ] ', '', true, 'To do')} aria-label="Checklist" disabled={preview}><ListChecks /></Button>
            </TooltipTrigger><TooltipContent>Checklist</TooltipContent></Tooltip>
            <DropdownMenu>
              <Tooltip><TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm" className={tool} aria-label="Callout" disabled={preview}><MessageSquareWarning /></Button>
                </DropdownMenuTrigger>
              </TooltipTrigger><TooltipContent>Callout</TooltipContent></Tooltip>
              <DropdownMenuContent align="start">
                {[['NOTE', 'Note'], ['TIP', 'Tip'], ['WARNING', 'Heads up'], ['DONE', 'Decision']].map(([k, l]) => (
                  <DropdownMenuItem key={k} onSelect={() => apply(`> [!${k}] `, '', true, l)}>{l}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover open={mention} onOpenChange={setMention}>
              <Tooltip><TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm" className={tool} aria-label="Mention someone" disabled={preview}><AtSign /></Button>
                </PopoverTrigger>
              </TooltipTrigger><TooltipContent>Mention</TooltipContent></Tooltip>
              <PopoverContent className="w-56 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Mention…" />
                  <CommandList>
                    <CommandEmpty>Nobody by that name.</CommandEmpty>
                    <CommandGroup>
                      {people.map(u => (
                        <CommandItem key={u.id} onSelect={() => { setMention(false); apply(`@${u.name.split(' ')[0]} `) }}>
                          <Avatar user={u} size={20} />{u.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" className="text-slate" onClick={() => setPreview(p => !p)}>
              {preview ? <><PenLine />Edit</> : <><Eye />Preview</>}
            </Button>
            {onCancel && <Button type="button" size="sm" variant="ghost" onClick={() => { setPreview(false); onCancel() }}>Cancel</Button>}
            {onSubmit && <Button type="button" size="sm" onClick={() => { setPreview(false); onSubmit() }} disabled={!value.trim()}>{submitLabel}</Button>}
          </div>
        </div>
      )}
    </div>
  )
}
