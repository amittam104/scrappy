import { SignupForm } from '#/components/common/SignupForm'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/signup/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="max-w-lg w-full p-4">
      <SignupForm />
    </div>
  )
}
