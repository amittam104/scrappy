import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { getItemsFn } from '#/data/items'
import { statusEnum } from '#/db/schema'
import { copyToClipboard } from '#/lib/clipboard'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Copy } from 'lucide-react'

export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
  loader: () => getItemsFn(),
})

function RouteComponent() {
  const data = Route.useLoaderData()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Items</h1>
        <p className="text-muted-foreground">Your saved articles and content</p>
      </div>
      {/* Search and Filter Controls */}
      <div className="flex gap-4">
        <Input placeholder="Search by title or tags" />
        <Select>
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
      <div className="grid gap-6 md:grid-cols-2">
        {data.map((item) => {
          return (
            <Card
              key={item.id}
              className="group overflow-hidden hover:shadow-lg pt-0"
            >
              <Link to="/dashboard" className="block">
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
                      {item.status.charAt(0) +
                        item.status.slice(1).toLowerCase()}
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
                    <p className="text-sm text-muted-foreground">
                      {item.author}
                    </p>
                  )}
                </CardHeader>
              </Link>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
