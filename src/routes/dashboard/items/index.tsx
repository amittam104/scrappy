import { Badge } from '#/components/ui/badge'
import { Button, buttonVariants } from '#/components/ui/button'
import { Card, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Skeleton } from '#/components/ui/skeleton'
import { getItemsFn } from '#/data/items'
import { statusEnum } from '#/db/schema'
import { copyToClipboard } from '#/lib/clipboard'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Copy, InboxIcon } from 'lucide-react'
import { Suspense, use, useEffect, useState } from 'react'
import z from 'zod'

const searchParamsSchema = z.object({
  q: z.string().default(''),
  status: z.enum(['all', ...statusEnum.enumValues]).default('all'),
})

type ItemsSearch = z.infer<typeof searchParamsSchema>

function ItemsGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden pt-0">
          <Skeleton className="aspect-video w-full" />
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="size-8 rounded-md" />
            </div>

            {/* Title */}
            <Skeleton className="h-6 w-full" />

            {/* Author  */}
            <Skeleton className="h-4 w-40" />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

function ItemsList({
  q,
  status,
  data,
}: {
  q: ItemsSearch['q']
  status: ItemsSearch['status']
  data: ReturnType<typeof getItemsFn>
}) {
  const items = use(data)

  const filteredItems = items.filter((item) => {
    const matchesQuery =
      q === '' ||
      item.title?.toLowerCase().includes(q.toLowerCase()) ||
      item.tags?.some((tag) =>
        tag.toLocaleLowerCase().includes(q.toLocaleLowerCase()),
      )

    const matchesStatus =
      status === 'all' || item.status.toLowerCase() === status.toLowerCase()

    return matchesQuery && matchesStatus
  })

  if (filteredItems.length === 0) {
    return (
      <Empty className="border rounded-lg h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon className="size-13" />
          </EmptyMedia>
          <EmptyTitle>
            {items.length === 0 ? 'No Items saved yet' : 'No items found'}
          </EmptyTitle>
          <EmptyDescription>
            {items.length === 0
              ? 'Import a url to get started'
              : 'No Items match your search criteria'}
          </EmptyDescription>
        </EmptyHeader>
        {items.length === 0 && (
          <EmptyContent>
            <Link to="/dashboard/import" className={buttonVariants()} />
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {filteredItems.map((item) => {
        return (
          <Card
            key={item.id}
            className="group overflow-hidden hover:shadow-lg pt-0"
          >
            <Link
              to="/dashboard/items/$itemId"
              params={{ itemId: item.id }}
              className="block"
            >
              {item.ogImage && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={item.ogImage}
                    alt={item.title ?? 'Article Thumbnail'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <CardHeader className="space-y-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      item.status === 'COMPLETED' ? 'default' : 'secondary'
                    }
                  >
                    {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                  </Badge>
                  <Button
                    onClick={async (e) => {
                      e.preventDefault()
                      await copyToClipboard(item.url)
                    }}
                    variant="outline"
                    size="icon"
                    className="size-8"
                  >
                    <Copy className="h-4 w-4 " />
                  </Button>
                </div>
                <CardTitle className="line-clamp-2 text-xl leading-snug group-hover:text-foreground/70 transition-colors duration-300 ease-in-out">
                  {item.title}
                </CardTitle>
                {item.author && (
                  <p className="text-sm text-muted-foreground">{item.author}</p>
                )}
              </CardHeader>
            </Link>
          </Card>
        )
      })}
    </div>
  )
}

export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
  loader: () => ({ itemsPromise: getItemsFn() }),
  validateSearch: searchParamsSchema,
  head: () => ({
    meta: [{ title: 'Saved Items' }],
  }),
})

function RouteComponent() {
  const { itemsPromise } = Route.useLoaderData()
  const { q, status } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(q)
  const navigate = useNavigate({ from: Route.fullPath })

  useEffect(() => {
    if (searchInput === q) return

    const timeout = setTimeout(() => {
      navigate({ search: (prev) => ({ ...prev, q: searchInput }) })
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchInput, navigate, q])

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Items</h1>
        <p className="text-muted-foreground">Your saved articles and content</p>
      </div>
      {/* Search and Filter Controls */}
      <div className="flex gap-4">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title or tags"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            navigate({
              search: (prev) => ({ ...prev, status: value as typeof status }),
            })
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusEnum.enumValues.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Suspense fallback={<ItemsGridSkeleton />}>
        <ItemsList q={q} status={status} data={itemsPromise} />
      </Suspense>
    </div>
  )
}
