import { useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function DatePicker({ id, value, onChange, placeholder = 'Due date', className, warn }: {
  id?: string; value: string | null; onChange: (v: string | null) => void; placeholder?: string; className?: string; warn?: boolean
}) {
  const [open, setOpen] = useState(false)
  const date = value ? new Date(value + 'T12:00:00') : undefined
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className={cn('h-8 justify-start gap-2 px-2.5 font-normal', !date && 'text-slate', warn && 'text-warning', className)}>
          <CalendarDays className="size-3.5" />
          {date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : placeholder}
          {date && (
            <span role="button" tabIndex={-1} aria-label="Clear date" className="ml-auto rounded-[3px] p-0.5 text-slate hover:bg-cloud hover:text-ink"
              onClick={e => { e.stopPropagation(); onChange(null) }}><X className="size-3" /></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} defaultMonth={date} onSelect={d => { onChange(d ? toISO(d) : null); setOpen(false) }} />
      </PopoverContent>
    </Popover>
  )
}
