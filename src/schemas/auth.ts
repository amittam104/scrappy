import z from 'zod'

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const signupSchema = z.object({
  fullname: z.string().min(4),
  email: z.email(),
  password: z.string().min(8),
})
