import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const { queryClient } = context; // Get QueryClient from router context

    // Fetch and cache Pokémon list
    return await queryClient.fetchQuery({
      queryKey: ["pals"],
      queryFn: fetchPals,
      staleTime: Infinity, // Cache indefinitely
    });
  },
  component: Index,
});

function Index() {
  const pals = Route.useLoaderData(); // Get preloaded data

  return (
    <div>
      {pals.map((pal) => (
        <React.Fragment key={pal.name}>
          <Link to={`/pals/${pal.name}`}>{pal.name}</Link>
          <br />
        </React.Fragment>
      ))}
    </div>
  );
}

// Fetch function for Pokémon list
const fetchPals = async () => {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=151`);
  if (!res.ok) throw new Error("Failed to fetch Pal");
  const data = await res.json();
  return data.results;
};