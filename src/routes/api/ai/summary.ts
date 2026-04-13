import { db } from '#/db/db'
import { savedItem } from '#/db/schema'
import { openrouter } from '#/lib/openRouter'
import { createFileRoute } from '@tanstack/react-router'
import { streamText } from 'ai'
import { and, eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/ai/summary')({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const { itemId, prompt } = await request.json()
        const userId = context?.session.user.id

        if (!userId) return new Response('User not authorized', { status: 401 })

        if (!itemId || !prompt) {
          console.error('Missing itemId or prompt:', { itemId, prompt })
          return new Response('Missing itemId or prompt', { status: 400 })
        }

        const item = await db.query.savedItem.findFirst({
          where: and(eq(savedItem.id, itemId), eq(savedItem.userId, userId)),
        })

        if (!item) return new Response('Item not found', { status: 404 })

        const result = streamText({
          model: openrouter.chat('nvidia/nemotron-3-nano-30b-a3b:free'),
          system: `You are a helpful assistant that creates concise, informative summaries of web content.
                    Your summaries should:
                    - Be 1-2 paragraphs long
                    - Capture the main points and key takeaways
                    - Be written in a clear, professional tone`,
          prompt: `Please summarize the following content:\n\n${prompt}`,
        })

        return result.toUIMessageStreamResponse()
      },
    },
  },
})
