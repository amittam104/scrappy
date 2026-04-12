import { db } from '#/db/db'
import { savedItem } from '#/db/schema'
import { firecrawl } from '#/lib/firecrawl'
import { bulkImportSchema, importSchema } from '#/schemas/import'
import type { extractSchema } from '#/schemas/import'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm/sql/expressions/conditions'
import type { z as zod } from 'zod'
import z from 'zod'
import { toast } from 'sonner'
import { authFnMiddleware } from '#/middlewares/auth'
import { desc } from 'drizzle-orm'
import { notFound } from '@tanstack/react-router'

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

export const bulkScrapeUrls = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(
    z.object({
      urls: z.array(z.url()),
    }),
  )
  .handler(async ({ data, context }) => {
    for (const url of data.urls) {
      const newAddedItem = await db
        .insert(savedItem)
        .values({ url, userId: context.session.user.id, status: 'PROCESSING' })
        .returning({ insertedId: savedItem.id })

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

        toast.success('URL scraped successfully!')
      } catch (error) {
        toast.error('Failed to scrape URL.')
        await db
          .update(savedItem)
          .set({ status: 'FAILED' })
          .where(eq(savedItem.id, newAddedItem[0].insertedId))
      }
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
