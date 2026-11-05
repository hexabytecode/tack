import { cx } from '@/lib/ui'

/* Placeholders shown while a page's code is still downloading on a slow connection.
   Same shapes as the real page, so nothing jumps when it arrives. */
export const Bone = ({ className }: { className?: string }) => <span className={cx('skel block rounded-[4px]', className)} />

function CardBone() {
  return (
    <div className="flex flex-col gap-2 rounded-[4px] border border-line bg-paper p-2.5">
      <Bone className="h-2.5 w-[85%]" /><Bone className="h-2.5 w-[55%]" />
      <div className="mt-1 flex items-center justify-between"><Bone className="h-3 w-[40%]" /><Bone className="size-5 rounded-full" /></div>
    </div>
  )
}

export function BoardSkeleton() {
  return (
    <div className="flex-1 bg-wash p-4 md:p-6" aria-busy="true" aria-label="Loading board">
      <div className="mb-4 flex gap-2"><Bone className="h-8 w-40" /><Bone className="h-8 w-28" /><Bone className="h-8 w-28" /></div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[3, 2, 2, 3].map((n, i) => (
          <div key={i} className={cx('flex flex-col gap-2 rounded-[4px] border border-line bg-cloud p-2.5', i > 0 && 'hidden sm:flex', i > 1 && 'sm:hidden lg:flex')}>
            <Bone className="mb-1 h-[18px] w-24 rounded-full" />
            {Array.from({ length: n }, (_, k) => <CardBone key={k} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="flex-1 bg-paper p-4 md:p-6" aria-busy="true" aria-label="Loading">
      <Bone className="mb-5 h-6 w-48" />
      <div className="overflow-hidden rounded-[6px] border border-line">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
            <Bone className="h-3 w-16" /><Bone className="h-3 flex-1" /><Bone className="hidden h-5 w-20 rounded-full sm:block" /><Bone className="size-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-4 px-4 py-16 md:px-6" aria-busy="true" aria-label="Loading">
      <Bone className="h-5 w-24" /><Bone className="h-12 w-[80%]" /><Bone className="h-4 w-[60%]" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Bone key={i} className="h-36 w-full rounded-[6px]" />)}</div>
    </div>
  )
}
