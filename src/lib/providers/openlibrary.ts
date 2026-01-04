import type {
  MediaProvider,
  ProviderSearchResult,
  ProviderItemDetails,
} from "./types";
import { registerProvider } from "./types";

interface OpenLibrarySearchDoc {
  key: string; // e.g., "/works/OL45883W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  edition_count?: number;
}

interface OpenLibrarySearchResponse {
  numFound: number;
  docs: OpenLibrarySearchDoc[];
}

interface OpenLibraryWork {
  key: string;
  title: string;
  description?: string | { value: string };
  covers?: number[];
  subjects?: string[];
  authors?: Array<{ author: { key: string } }>;
}

interface OpenLibraryAuthor {
  name: string;
}

function getCoverUrl(
  coverId: number | undefined,
  size: "S" | "M" | "L" = "M",
): string | undefined {
  if (!coverId) return undefined;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

function extractWorkId(key: string): string {
  // key is like "/works/OL45883W", extract just the ID
  return key.replace("/works/", "");
}

const openLibraryProvider: MediaProvider = {
  key: "openlibrary",
  name: "Open Library",

  async search(query: string): Promise<ProviderSearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      limit: "20",
      fields:
        "key,title,author_name,first_publish_year,cover_i,subject,edition_count",
    });

    const response = await fetch(
      `https://openlibrary.org/search.json?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`Open Library search failed: ${response.statusText}`);
    }

    const data: OpenLibrarySearchResponse = await response.json();

    return data.docs.map((doc) => ({
      externalId: extractWorkId(doc.key),
      title: doc.title,
      subtitle: doc.author_name?.join(", "),
      imageUrl: getCoverUrl(doc.cover_i),
      year: doc.first_publish_year,
      metadata: {
        authors: doc.author_name || [],
        subjects: doc.subject?.slice(0, 5) || [],
        editionCount: doc.edition_count,
      },
    }));
  },

  async getDetails(externalId: string): Promise<ProviderItemDetails | null> {
    const workResponse = await fetch(
      `https://openlibrary.org/works/${externalId}.json`,
    );

    if (!workResponse.ok) {
      if (workResponse.status === 404) return null;
      throw new Error(
        `Open Library work fetch failed: ${workResponse.statusText}`,
      );
    }

    const work: OpenLibraryWork = await workResponse.json();

    // Get author names
    const authorNames: string[] = [];
    if (work.authors && work.authors.length > 0) {
      const authorPromises = work.authors.slice(0, 5).map(async (a) => {
        try {
          const authorResponse = await fetch(
            `https://openlibrary.org${a.author.key}.json`,
          );
          if (authorResponse.ok) {
            const author: OpenLibraryAuthor = await authorResponse.json();
            return author.name;
          }
        } catch {
          // Ignore author fetch errors
        }
        return null;
      });
      const names = await Promise.all(authorPromises);
      authorNames.push(...names.filter((n): n is string => n !== null));
    }

    const description =
      typeof work.description === "string"
        ? work.description
        : work.description?.value;

    return {
      externalId,
      title: work.title,
      subtitle: authorNames.length > 0 ? authorNames.join(", ") : undefined,
      description,
      imageUrl: getCoverUrl(work.covers?.[0], "L"),
      metadata: {
        authors: authorNames,
        subjects: work.subjects?.slice(0, 10) || [],
        openLibraryKey: work.key,
      },
    };
  },
};

registerProvider(openLibraryProvider);

export { openLibraryProvider };
