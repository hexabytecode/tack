import { useRef, useState } from 'react'
import { AtSign, Bold, Code, Italic, Link2, List, ListChecks, ListOrdered, MessageSquareWarning, Quote } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import Markdown from './Markdown'
import { Avatar } from '@/lib/ui'
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
}

export default function MarkdownEditor({ id, value, onChange, onSubmit, submitLabel = 'Comment', placeholder, people, rows = 3, onCancel }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [tab, setTab] = useState('write')
  const [mention, setMention] = useState(false)

  const apply = (before: string, after = '', block = false) => {
    const el = ref.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    const picked = value.slice(s, e)
    const prefix = block && s > 0 && value[s - 1] !== '\n' ? '\n' : ''
    const next = value.slice(0, s) + prefix + before + picked + after + value.slice(e)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = s + prefix.length + before.length
      el.setSelectionRange(pos, pos + picked.length)
    })
  }

  const tools = [
    { icon: Bold, label: 'Bold', run: () => apply('**', '**') },
    { icon: Italic, label: 'Italic', run: () => apply('_', '_') },
    { icon: Code, label: 'Code', run: () => apply('`', '`') },
    { icon: Link2, label: 'Link', run: () => apply('[', '](https://)') },
    { icon: List, label: 'Bulleted list', run: () => apply('- ', '', true) },
    { icon: ListOrdered, label: 'Numbered list', run: () => apply('1. ', '', true) },
    { icon: ListChecks, label: 'Checklist', run: () => apply('- [ ] ', '', true) },
    { icon: Quote, label: 'Quote', run: () => apply('> ', '', true) },
  ]

  return (
    <div className="rounded-[4px] border border-line bg-paper focus-within:border-slate/60">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-2 py-1.5">
          <TabsList className="h-7 rounded-[4px] p-0.5">
            <TabsTrigger value="write" className="h-6 rounded-[3px] px-2.5 text-[12px]">Write</TabsTrigger>
            <TabsTrigger value="preview" className="h-6 rounded-[3px] px-2.5 text-[12px]">Preview</TabsTrigger>
          </TabsList>
          {tab === 'write' && (
            <div className="flex flex-wrap items-center gap-0.5">
              {tools.map(t => (
                <Tooltip key={t.label}>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon-sm" className="size-7 text-slate hover:text-ink" onClick={t.run} aria-label={t.label}><t.icon /></Button>
                  </TooltipTrigger>
                  <TooltipContent>{t.label}</TooltipContent>
                </Tooltip>
              ))}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon-sm" className="size-7 text-slate hover:text-ink" aria-label="Add a callout"><MessageSquareWarning /></Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Callout banner</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  {[['NOTE', 'Note'], ['TIP', 'Tip'], ['WARNING', 'Heads up'], ['DONE', 'Decision']].map(([k, l]) => (
                    <DropdownMenuItem key={k} onSelect={() => apply(`> [!${k}] `, '', true)}>{l}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Popover open={mention} onOpenChange={setMention}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm" className="size-7 text-slate hover:text-ink" aria-label="Mention someone"><AtSign /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="end">
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
          )}
        </div>
        <TabsContent value="write" className="m-0">
          <Textarea
            id={id}
            ref={ref}
            value={value}
            rows={rows}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit?.() } }}
            placeholder={placeholder}
            className="min-h-0 resize-y rounded-none border-0 px-3 py-2 text-[13.5px] shadow-none focus-visible:ring-0"
          />
        </TabsContent>
        <TabsContent value="preview" className="m-0 min-h-[76px] px-3 py-2">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-[13px] text-placeholder">Nothing to preview yet.</p>}
        </TabsContent>
      </Tabs>
      <div className="flex items-center justify-between border-t border-line px-3 py-1.5">
        <span className="font-mono text-[10.5px] text-slate">Markdown · @mention · WEB-142 links</span>
        <div className="flex gap-1.5">
          {onCancel && <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>}
          {onSubmit && <Button type="button" size="sm" onClick={onSubmit} disabled={!value.trim()}>{submitLabel}</Button>}
        </div>
      </div>
    </div>
  )
}
