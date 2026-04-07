import { Link, useNavigate } from '@tanstack/react-router'
import ThemeToggle from '../common/ThemeToggle'
import { Button, buttonVariants } from '../ui/button'
import { LogIn, LogOut, UserPlus } from 'lucide-react'
import { authClient } from '#/lib/auth-client'

export default function Header() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: '/' })
        },
      },
    })
  }

  return (
    <header className="sticky top-0 z-50 bg-background/90 px-4 backdrop-blur-lg w-full mx-auto border-b border-border/80">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4 w-full max-w-7xl mx-auto justify-between">
        <div className="flex items-center gap-2">
          <img
            src="https://tanstack.com/images/logos/logo-color-banner-600.png"
            alt="Tanstack Logo"
            className="size-6"
          />
          <h1 className="text-base font-bold">TS-Scrapy</h1>
        </div>
        <div></div>
        <div className="flex items-center gap-4">
          <div>
            <ThemeToggle />
          </div>
          {isPending ? null : !session ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={buttonVariants({ variant: 'secondary' })}
              >
                Log in <LogIn className="size-3 ml-0.5" />
              </Link>
              <Link
                to="/signup"
                className={buttonVariants({ variant: 'default' })}
              >
                Sign up <UserPlus className="size-3 ml-0.5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => handleSignOut()}
                variant="destructive"
              >
                Log Out <LogOut className="size-3 ml-0.5" />
              </Button>
              <Link
                to="/dashboard"
                className={buttonVariants({ variant: 'default' })}
              >
                Dashboard
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
