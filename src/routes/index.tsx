import Header from '#/components/marketing/Header'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="h-screen flex flex-col mx-auto w-full">
      <Header />
      <div className="bg-background h-full max-w-7xl mx-auto my-8">
        Main Area
      </div>
    </div>
  )
}
