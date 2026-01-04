import type {
  MediaProvider,
  ProviderItemDetails,
  ProviderSearchResult,
} from "./types";
import { registerProvider } from "./types";

// AniList GraphQL types
interface AniListMedia {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  coverImage: {
    large: string | null;
    extraLarge: string | null;
  };
  startDate: {
    year: number | null;
  };
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  genres: string[];
  averageScore: number | null;
  status: string;
  format: string;
}

interface AniListSearchResponse {
  data: {
    Page: {
      media: AniListMedia[];
    };
  };
}

interface AniListDetailsResponse {
  data: {
    Media: AniListMedia | null;
  };
}

type AniListMediaType = "ANIME" | "MANGA";

const ANILIST_API = "https://graphql.anilist.co";

const SEARCH_QUERY = `
query ($search: String!, $type: MediaType!, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(search: $search, type: $type, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        large
        extraLarge
      }
      startDate {
        year
      }
      episodes
      chapters
      volumes
      genres
      averageScore
      status
      format
    }
  }
}
`;

const DETAILS_QUERY = `
query ($id: Int!) {
  Media(id: $id) {
    id
    title {
      romaji
      english
      native
    }
    description
    coverImage {
      large
      extraLarge
    }
    startDate {
      year
    }
    episodes
    chapters
    volumes
    genres
    averageScore
    status
    format
  }
}
`;

async function anilistFetch<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.statusText}`);
  }

  return response.json();
}

function cleanDescription(desc: string | null): string | undefined {
  if (!desc) return undefined;
  // Remove HTML tags from AniList descriptions
  return desc.replace(/<[^>]*>/g, "").trim();
}

function getTitle(title: AniListMedia["title"]): string {
  return title.english || title.romaji || title.native || "Unknown Title";
}

function mapMediaToResult(media: AniListMedia): ProviderSearchResult {
  return {
    externalId: media.id.toString(),
    title: getTitle(media.title),
    subtitle:
      media.title.romaji !== getTitle(media.title)
        ? media.title.romaji
        : undefined,
    description: cleanDescription(media.description),
    imageUrl:
      media.coverImage.extraLarge || media.coverImage.large || undefined,
    year: media.startDate.year || undefined,
    metadata: {
      format: media.format,
      status: media.status,
      episodes: media.episodes,
      chapters: media.chapters,
      volumes: media.volumes,
      genres: media.genres,
      averageScore: media.averageScore,
      titles: media.title,
    },
  };
}

function createAniListProvider(mediaType: AniListMediaType): MediaProvider {
  const key = mediaType === "ANIME" ? "anilist-anime" : "anilist-manga";
  const name = mediaType === "ANIME" ? "AniList (Anime)" : "AniList (Manga)";

  return {
    key,
    name,

    async search(query: string): Promise<ProviderSearchResult[]> {
      const data = await anilistFetch<AniListSearchResponse>(SEARCH_QUERY, {
        search: query,
        type: mediaType,
        perPage: 20,
      });

      return data.data.Page.media.map(mapMediaToResult);
    },

    async getDetails(externalId: string): Promise<ProviderItemDetails | null> {
      const id = Number.parseInt(externalId, 10);
      if (Number.isNaN(id)) return null;

      const data = await anilistFetch<AniListDetailsResponse>(DETAILS_QUERY, {
        id,
      });

      const media = data.data.Media;
      if (!media) return null;

      const result = mapMediaToResult(media);

      // For anime, we could potentially create episode segments
      // For manga, we could create chapter segments
      // But for MVP, we'll leave segments empty and let users add manually

      return {
        ...result,
        segments: undefined,
      };
    },
  };
}

const anilistAnimeProvider = createAniListProvider("ANIME");
const anilistMangaProvider = createAniListProvider("MANGA");

registerProvider(anilistAnimeProvider);
registerProvider(anilistMangaProvider);

export { anilistAnimeProvider, anilistMangaProvider };
