import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ai/summary')({
  server: {
    handlers: {
      POST: async () => {},
    },
  },
})
