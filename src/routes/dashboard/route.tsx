import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import AppHeader from '#/components/app/AppHeader'
import { getSession } from '#/data/session'

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  loader: async () => {
    const session = await getSession()

    return { user: session.user }
  },
})

function RouteComponent() {
  const { user } = Route.useLoaderData()

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <AppHeader />
        <div className="flex items-start justify-start p-4 h-screen">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
