import { db } from '#/db/db'
import { savedItem } from '#/db/schema'
import { firecrawl } from '#/lib/firecrawl'
import { bulkImportSchema, importSchema, searchSchema } from '#/schemas/import'
import type { extractSchema } from '#/schemas/import'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm/sql/expressions/conditions'
import type { z as zod } from 'zod'
import z from 'zod'
import { toast } from 'sonner'
import { authFnMiddleware } from '#/middlewares/auth'
import { desc } from 'drizzle-orm'
import { notFound } from '@tanstack/react-router'
import { generateText } from 'ai'
import { openrouter } from '#/lib/openRouter'
import type { SearchResultWeb } from '@mendable/firecrawl-js'

export const scrapeUrl = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(importSchema)
  .handler(async ({ data, context }) => {
    const { session } = context
    const userId = session.user.id

    const createdItem = await db
      .insert(savedItem)
      .values({ url: data.url, userId, status: 'PROCESSING' })
      .returning({ insertedId: savedItem.id })

    try {
      const result = await firecrawl.scrape(data.url, {
        formats: [
          'markdown',
          {
            type: 'json',
            // schema: extractSchema,
            prompt:
              'please extract the author and published date from the article and return it in the following JSON format: { "author": "author name", "publishedAt": "published date" }',
          },
        ],
        location: {
          country: 'US',
          languages: ['en'],
        },
        onlyMainContent: true,
      })

      const jsonData = result.json
        ? (result.json as zod.infer<typeof extractSchema>)
        : null

      const updatedItem = await db
        .update(savedItem)
        .set({
          title: result.metadata?.title || null,
          content: result.markdown || null,
          ogImage: result.metadata?.ogImage || null,
          author: jsonData?.author || null,
          publishedAt: jsonData?.publishedAt
            ? new Date(jsonData.publishedAt)
            : null,
          status: 'COMPLETED',
        })
        .where(eq(savedItem.id, createdItem[0].insertedId))
        .returning({
          title: savedItem.title,
          content: savedItem.content,
          ogImage: savedItem.ogImage,
          author: savedItem.author,
          publishedAt: savedItem.publishedAt,
        })

      toast.success('URL scraped successfully!')
      return updatedItem
    } catch (error) {
      toast.error('Failed to scrape URL.')
      await db
        .update(savedItem)
        .set({ status: 'FAILED' })
        .where(eq(savedItem.id, createdItem[0].insertedId))
    }
  })

export const mapUrl = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(bulkImportSchema)
  .handler(async ({ data }) => {
    const result = await firecrawl.map(data.url, {
      limit: 20,
      search: data.search,
      location: {
        country: 'US',
        languages: ['en'],
      },
    })

    return result.links
  })

export type bulkScrapeProgress = {
  completed: number
  total: number
  url: string
  status: 'Success' | 'Failed'
}

export const bulkScrapeUrls = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(
    z.object({
      urls: z.array(z.url()),
    }),
  )
  .handler(async function* ({ data, context }) {
    const total = data.urls.length

    for (const [i, url] of data.urls.entries()) {
      const newAddedItem = await db
        .insert(savedItem)
        .values({ url, userId: context.session.user.id, status: 'PROCESSING' })
        .returning({ insertedId: savedItem.id })

      let status: bulkScrapeProgress['status']

      try {
        const result = await firecrawl.scrape(url, {
          formats: [
            'markdown',
            {
              type: 'json',
              // schema: extractSchema,
              prompt:
                'please extract the author and published date from the article and return it in the following JSON format: { "author": "author name", "publishedAt": "published date" }',
            },
          ],
          location: {
            country: 'US',
            languages: ['en'],
          },
          onlyMainContent: true,
        })

        const jsonData = result.json
          ? (result.json as zod.infer<typeof extractSchema>)
          : null

        await db
          .update(savedItem)
          .set({
            title: result.metadata?.title || null,
            content: result.markdown || null,
            ogImage: result.metadata?.ogImage || null,
            author: jsonData?.author || null,
            publishedAt: jsonData?.publishedAt
              ? new Date(jsonData.publishedAt)
              : null,
            status: 'COMPLETED',
          })
          .where(eq(savedItem.id, newAddedItem[0].insertedId))
          .returning({
            title: savedItem.title,
            content: savedItem.content,
            ogImage: savedItem.ogImage,
            author: savedItem.author,
            publishedAt: savedItem.publishedAt,
          })
        status = 'Success'
        toast.success('URL scraped successfully!')
      } catch (error) {
        status = 'Failed'
        toast.error('Failed to scrape URL.')
        await db
          .update(savedItem)
          .set({ status: 'FAILED' })
          .where(eq(savedItem.id, newAddedItem[0].insertedId))
      }
      const progress: bulkScrapeProgress = {
        completed: i + 1,
        total: total,
        url: url,
        status: status,
      }

      yield progress
    }
  })

export const getItemsFn = createServerFn({ method: 'GET' })
  .middleware([authFnMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id

    const result = await db
      .select()
      .from(savedItem)
      .where(eq(savedItem.userId, userId))
      .orderBy(desc(savedItem.createdAt))

    return result
  })

export const getItemByIdFn = createServerFn({ method: 'GET' })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const userId = context.session.user.id

    const results = await db
      .select()
      .from(savedItem)
      .where(and(eq(savedItem.id, data.id), eq(savedItem.userId, userId)))
      .limit(1)

    if (results.length === 0) {
      throw notFound()
    }

    return results[0]
  })

export const saveSummaryAndGenerateTags = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(
    z.object({
      id: z.string(),
      summary: z.string(),
    }),
  )
  .handler(async ({ data, context }) => {
    const userId = context.session.user.id

    const existingItem = await db.query.savedItem.findFirst({
      where: and(eq(savedItem.id, data.id), eq(savedItem.userId, userId)),
    })

    if (!existingItem) {
      throw notFound()
    }

    const { text } = await generateText({
      model: openrouter.chat('nvidia/nemotron-3-nano-30b-a3b:free'),
      system: `You are a helpful assistant that extracts relevant tags from content summaries.
Extract 3-5 short, relevant tags that categorize the content.
Return ONLY a comma-separated list of tags, nothing else.
Example: technology, programming, web development, javascript`,
      prompt: `Extract tags from this summary: \n\n${data.summary}`,
    })

    const tags = text
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0)
      .slice(0, 5)

    const updatedItem = await db
      .update(savedItem)
      .set({ summary: data.summary, tags: tags })
      .where(and(eq(savedItem.id, data.id), eq(savedItem.userId, userId)))
      .returning()

    return updatedItem[0]
  })

export const searchWebFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(searchSchema)
  .handler(async ({ data }) => {
    const results = await firecrawl.search(data.query, {
      limit: 10,
      scrapeOptions: { formats: ['markdown'] },
      location: 'India',
      tbs: 'qdr:y',
    })

    console.log(results)

    if (!results.web || results.web.length === 0) {
      return []
    }

    return results.web.map((item) => ({
      title: (item as SearchResultWeb).title,
      url: (item as SearchResultWeb).url,
      description: (item as SearchResultWeb).description,
    }))
  })
