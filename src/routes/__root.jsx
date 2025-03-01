import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const DEV = process.env.NODE_ENV === "development"; // Check if in development mode

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">Home</Link>{" "}
        <Link to="/about" className="[&.active]:font-bold">About</Link>
      </div>
      <hr />
      <Outlet />
      
      {/* Only show DevTools in development */}
      {DEV && <TanStackRouterDevtools />}
      {DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </>
  ),
});