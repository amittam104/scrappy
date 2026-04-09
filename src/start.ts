import { createStart } from '@tanstack/react-start'
import { authMiddleware } from './middlewares/auth'

export const startInstance = createStart(() => {
  return { requestMiddleware: [authMiddleware] }
})
