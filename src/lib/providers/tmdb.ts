import type {
  MediaProvider,
  ProviderItemDetails,
  ProviderSearchResult,
} from "./types";
import { registerProvider } from "./types";

// TMDB types
interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
}

interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  status?: string;
}

interface TMDBSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function getImageUrl(path: string | null, size = "w500"): string | undefined {
  if (!path) return undefined;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error("TMDB_API_KEY environment variable is not set");
  }
  return key;
}

async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  url.searchParams.set("api_key", getApiKey());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  return response.json();
}

function extractYear(dateStr: string | undefined): number | undefined {
  if (!dateStr) return undefined;
  const year = Number.parseInt(dateStr.slice(0, 4), 10);
  return Number.isNaN(year) ? undefined : year;
}

// Movie provider
const tmdbMovieProvider: MediaProvider = {
  key: "tmdb-movie",
  name: "TMDB (Movies)",

  async search(query: string): Promise<ProviderSearchResult[]> {
    const data = await tmdbFetch<TMDBSearchResponse<TMDBMovie>>(
      "/search/movie",
      {
        query,
        include_adult: "false",
      },
    );

    return data.results.slice(0, 20).map((movie) => ({
      externalId: movie.id.toString(),
      title: movie.title,
      subtitle:
        movie.original_title !== movie.title ? movie.original_title : undefined,
      description: movie.overview || undefined,
      imageUrl: getImageUrl(movie.poster_path),
      year: extractYear(movie.release_date),
      metadata: {
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        genreIds: movie.genre_ids,
        backdropPath: movie.backdrop_path,
      },
    }));
  },

  async getDetails(externalId: string): Promise<ProviderItemDetails | null> {
    const id = Number.parseInt(externalId, 10);
    if (Number.isNaN(id)) return null;

    try {
      const movie = await tmdbFetch<TMDBMovie>(`/movie/${id}`);

      return {
        externalId: movie.id.toString(),
        title: movie.title,
        subtitle:
          movie.original_title !== movie.title
            ? movie.original_title
            : undefined,
        description: movie.overview || undefined,
        imageUrl: getImageUrl(movie.poster_path, "w780"),
        metadata: {
          releaseDate: movie.release_date,
          runtime: movie.runtime,
          voteAverage: movie.vote_average,
          voteCount: movie.vote_count,
          genres: movie.genres?.map((g) => g.name) || [],
          backdropUrl: getImageUrl(movie.backdrop_path, "w1280"),
        },
      };
    } catch {
      return null;
    }
  },
};

// TV Show provider
const tmdbTVProvider: MediaProvider = {
  key: "tmdb-tv",
  name: "TMDB (TV Shows)",

  async search(query: string): Promise<ProviderSearchResult[]> {
    const data = await tmdbFetch<TMDBSearchResponse<TMDBTVShow>>("/search/tv", {
      query,
      include_adult: "false",
    });

    return data.results.slice(0, 20).map((show) => ({
      externalId: show.id.toString(),
      title: show.name,
      subtitle:
        show.original_name !== show.name ? show.original_name : undefined,
      description: show.overview || undefined,
      imageUrl: getImageUrl(show.poster_path),
      year: extractYear(show.first_air_date),
      metadata: {
        voteAverage: show.vote_average,
        voteCount: show.vote_count,
        genreIds: show.genre_ids,
        backdropPath: show.backdrop_path,
      },
    }));
  },

  async getDetails(externalId: string): Promise<ProviderItemDetails | null> {
    const id = Number.parseInt(externalId, 10);
    if (Number.isNaN(id)) return null;

    try {
      const show = await tmdbFetch<TMDBTVShow>(`/tv/${id}`);

      return {
        externalId: show.id.toString(),
        title: show.name,
        subtitle:
          show.original_name !== show.name ? show.original_name : undefined,
        description: show.overview || undefined,
        imageUrl: getImageUrl(show.poster_path, "w780"),
        metadata: {
          firstAirDate: show.first_air_date,
          numberOfSeasons: show.number_of_seasons,
          numberOfEpisodes: show.number_of_episodes,
          episodeRunTime: show.episode_run_time,
          status: show.status,
          voteAverage: show.vote_average,
          voteCount: show.vote_count,
          genres: show.genres?.map((g) => g.name) || [],
          backdropUrl: getImageUrl(show.backdrop_path, "w1280"),
        },
      };
    } catch {
      return null;
    }
  },
};

registerProvider(tmdbMovieProvider);
registerProvider(tmdbTVProvider);

export { tmdbMovieProvider, tmdbTVProvider };
