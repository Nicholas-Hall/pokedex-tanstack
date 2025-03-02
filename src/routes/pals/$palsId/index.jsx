import { createFileRoute } from "@tanstack/react-router";
import { openDB } from "idb"; // IndexedDB helper library
import PalRotatingImage from "@components/PalRotatingImage";

export const Route = createFileRoute("/pals/$palsId/")({
  loader: async ({ params, context }) => {
    const { queryClient } = context; // Get the QueryClient from router context
    const palsId = params.palsId;

    // Fetch and cache species data
    const speciesData = await queryClient.fetchQuery({
      queryKey: ["pal-species", palsId],
      queryFn: () => fetchPalSpecies(palsId),
      staleTime: Infinity,
    });

    const name = speciesData?.name;

    // Fetch and cache pal data
    const pal = name
      ? await queryClient.fetchQuery({
          queryKey: ["pal", name],
          queryFn: () => fetchPal(name),
          staleTime: Infinity,
        })
      : null;

    // Fetch and cache evolution chain data
    const evolutionChainUrl = speciesData?.evolution_chain?.url;
    const evolutionChainData = evolutionChainUrl
      ? await queryClient.fetchQuery({
          queryKey: ["evolution-chain", evolutionChainUrl],
          queryFn: () => fetchEvolutionChain(evolutionChainUrl),
          staleTime: Infinity,
        })
      : null;

    // Extract evolution names
    const getEvolutionNames = (chain) => {
      if (!chain) return [];
      const names = [];
      let currentChain = chain;
      while (currentChain) {
        names.push(currentChain.species.name);
        currentChain = currentChain.evolves_to[0]; // Only considers first evolution path
      }
      return names;
    };

    const evolutionNames = evolutionChainData ? getEvolutionNames(evolutionChainData.chain) : [];

    // Fetch and cache evolution Pokémon details
    const evolutionDetails = await Promise.all(
      evolutionNames.map(async (name) => {
        const pokemon = await queryClient.fetchQuery({
          queryKey: ["pal", name],
          queryFn: () => fetchPal(name),
          staleTime: Infinity,
        });

        // ✅ Cache images in IndexedDB
        await cacheImageIndexedDB(pokemon.sprites.front_default);
        await cacheImageIndexedDB(pokemon.sprites.back_default);

        return pokemon;
      })
    );

    // ✅ Preload images from IndexedDB
    [pal, ...evolutionDetails].forEach(async (pokemon) => {
      if (pokemon) {
        preloadCachedImage(await getCachedImageIndexedDB(pokemon.sprites.front_default));
        preloadCachedImage(await getCachedImageIndexedDB(pokemon.sprites.back_default));
      }
    });

    return { pal, speciesData, evolutionChainData, evolutionDetails };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { pal, evolutionDetails } = Route.useLoaderData();

  return (
    <div>
      <h2>{pal?.name} Evolution Chain</h2>
      <div>
        {evolutionDetails.map((_pal) => (
          <PalRotatingImage
            key={_pal.id}
            front={getCachedImageIndexedDB(_pal.sprites.front_default)}
            back={getCachedImageIndexedDB(_pal.sprites.back_default)}
          />
        ))}
      </div>
    </div>
  );
}

// ✅ Function to cache images in IndexedDB
const cacheImageIndexedDB = async (url) => {
  if (!url) return;

  const db = await openDB("pokemon-images", 1, {
    upgrade(db) {
      db.createObjectStore("images");
    },
  });

  const existingImage = await db.get("images", url);
  if (existingImage) return; // Skip caching if already exists

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    await db.put("images", blob, url);
  } catch (error) {
    console.error("Failed to cache image in IndexedDB:", error);
  }
};

// ✅ Function to retrieve cached image from IndexedDB
const getCachedImageIndexedDB = async (url) => {
  if (!url) return url;

  const db = await openDB("pokemon-images", 1);
  const blob = await db.get("images", url);

  return blob ? URL.createObjectURL(blob) : url; // Return cached image URL or fallback to original
};

// ✅ Function to preload cached images (faster rendering)
const preloadCachedImage = (url) => {
  if (!url) return;
  let img = new Image();
  img.src = url;
};

// Fetching functions
const fetchPal = async (name) => {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  if (!res.ok) throw new Error("Failed to fetch Pal");
  return res.json();
};

const fetchPalSpecies = async (palId) => {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${palId}`);
  if (!res.ok) throw new Error("Failed to fetch PalSpecies");
  return res.json();
};

const fetchEvolutionChain = async (evolutionChainUrl) => {
  const res = await fetch(evolutionChainUrl);
  if (!res.ok) throw new Error("Failed to fetch EvolutionChain");
  return res.json();
};
