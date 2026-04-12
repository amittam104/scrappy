import { MessageResponse } from '#/components/ai-elements/message'
import { Badge } from '#/components/ui/badge'
import { Button, buttonVariants } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import { getItemByIdFn } from '#/data/items'
import { cn } from '#/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  ExternalLink,
  UserIcon,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/items/$itemId')({
  component: RouteComponent,
  loader: ({ params }) => getItemByIdFn({ data: { id: params.itemId } }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title ?? 'Item Details',
      },
      {
        property: 'og:title',
        content: loaderData?.title ?? 'Item Details',
      },
      {
        property: 'og:image',
        content: loaderData?.ogImage ?? '',
      },
      {
        name: 'twitter:title',
        content: loaderData?.title ?? 'Item Details',
      },
    ],
  }),
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const [contentOpen, setContentOpen] = useState(false)

  return (
    <div className="w-full mx-auto max-w-5xl space-y-6">
      <div className="flex justify-start">
        <Link
          to="/dashboard/items"
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to items
        </Link>
      </div>
      {data.ogImage && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={data.ogImage}
            alt={data.title || 'OG Image'}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
          />
        </div>
      )}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {data.title ?? 'Untitled'}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {data.author && (
            <span className="inline-flex gap-1 items-center">
              <UserIcon className=" size-3" />
              {data.author}
            </span>
          )}
          {data.publishedAt && (
            <span className="inline-flex gap-1 items-center">
              <Calendar className="size-3" />
              {new Date(data.publishedAt).toLocaleDateString('en-UK', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
          <span className="inline-flex gap-1 items-center">
            <Clock className="size-3" />
            {new Date(data.createdAt).toLocaleDateString('en-UK', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <a
          href={data.url}
          target="_blank"
          className="text-muted-foreground hover:underline inline-flex items-center gap-1 text-sm"
        >
          View Original
          <ExternalLink className="size-3.5" />
        </a>

        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <Badge>{tag}</Badge>
            ))}
          </div>
        )}

        <p>This is for the summary</p>

        {/* Content Section */}

        {data.content && (
          <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="font-medium">Full Content</span>
                <ChevronDown
                  className={cn(
                    contentOpen ? 'rotate-180' : '',
                    'size-4 transition-transform delay-200 ease-in-out, duration-200',
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2">
                <CardContent>
                  <MessageResponse>{data.content}</MessageResponse>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}
