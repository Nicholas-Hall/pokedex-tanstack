import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pals/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/pals/"!</div>
}
