import { LoginForm } from '#/components/common/LoginForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/login/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="max-w-lg w-full p-4">
      <LoginForm />
    </div>
  )
}
