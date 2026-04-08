import { db } from '#/db/db'
import { savedItem } from '#/db/schema'
import { firecrawl } from '#/lib/firecrawl'
import { importSchema } from '#/schemas/import'
import type { extractSchema } from '#/schemas/import'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from './session'
import { eq } from 'drizzle-orm/sql/expressions/conditions'
import type z from 'zod'
import { toast } from 'sonner'

export const scrapeUrl = createServerFn({ method: 'POST' })
  .inputValidator(importSchema)
  .handler(async ({ data }) => {
    const session = await getSession()
    const userId = session.user.id

    if (!userId) {
      throw new Error('Unauthorized')
    }

    const createdItem = await db
      .insert(savedItem)
      .values({ url: data.url, userId: userId, status: 'PROCESSING' })
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
        onlyMainContent: true,
      })

      const jsonData = result.json
        ? (result.json as z.infer<typeof extractSchema>)
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
