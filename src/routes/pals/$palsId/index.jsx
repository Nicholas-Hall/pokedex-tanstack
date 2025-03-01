import { createFileRoute } from "@tanstack/react-router";
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

        // ✅ Cache images in localStorage
        await cacheImage(pokemon.sprites.front_default);
        await cacheImage(pokemon.sprites.back_default);

        return pokemon;
      })
    );

    // ✅ Preload images from localStorage
    [pal, ...evolutionDetails].forEach((pokemon) => {
      if (pokemon) {
        preloadCachedImage(pokemon.sprites.front_default);
        preloadCachedImage(pokemon.sprites.back_default);
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
            front={getCachedImage(_pal.sprites.front_default)}
            back={getCachedImage(_pal.sprites.back_default)}
          />
        ))}
      </div>
    </div>
  );
}

// ✅ Function to cache images in localStorage
const cacheImage = async (url) => {
  if (!url || localStorage.getItem(url)) return; // Skip if already cached

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();

    reader.onloadend = () => {
      localStorage.setItem(url, reader.result); // Save Base64 image
    };

    reader.readAsDataURL(blob);
  } catch (error) {
    console.error("Failed to cache image:", error);
  }
};

// ✅ Function to retrieve cached image from localStorage
const getCachedImage = (url) => {
  return localStorage.getItem(url) || url; // Return cached image or fallback to original
};

// ✅ Function to preload cached images (faster rendering)
const preloadCachedImage = (url) => {
  const cachedImage = getCachedImage(url);
  if (!cachedImage) return;

  let img = new Image();
  img.src = cachedImage;
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
