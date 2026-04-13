import { MessageResponse } from '#/components/ai-elements/message'
import { Badge } from '#/components/ui/badge'
import { Button, buttonVariants } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import { getItemByIdFn, saveSummaryAndGenerateTags } from '#/data/items'
import { cn } from '#/lib/utils'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
  UserIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { toast } from 'sonner'

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
  const router = useRouter()

  const { completion, complete, isLoading } = useCompletion({
    api: '/api/ai/summary',
    initialCompletion: data.summary || undefined,
    body: {
      itemId: data.id,
    },
    onFinish: async (_prompt, completionText) => {
      await saveSummaryAndGenerateTags({
        data: { id: data.id, summary: completionText },
      })

      toast.success('Summary generated successfully')
      router.invalidate()
    },
    onError: (err) => {
      console.error('Error fetching summary:', err.message)
      toast.error(err.message || 'Failed to fetch summary')
    },
  })

  function handleGenerateSummary() {
    if (!data.content) {
      toast.error('No content available to summarize')
      return
    }

    complete(data.content)
  }

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

        {/* AI Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="tracking-wide text-primary mb-3">
                  {completion || data.summary ? (
                    <MessageResponse>{completion}</MessageResponse>
                  ) : (
                    <p className="text-sm  text-muted-foreground italic">
                      {data.content
                        ? 'No summary yet. Generate one with AI'
                        : 'No content available to summarize'}
                    </p>
                  )}
                </h2>
              </div>
              {data.content && !data.summary && (
                <Button
                  disabled={isLoading}
                  size="sm"
                  onClick={handleGenerateSummary}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Generate Summary
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

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
