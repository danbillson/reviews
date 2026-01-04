import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { mediaType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NewItemForm } from "./new-item-form";

export default async function NewItemPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  // Get user's media types
  const types = await db.query.mediaType.findMany({
    where: eq(mediaType.userId, session.user.id),
    orderBy: (mediaType, { asc }) => [asc(mediaType.name)],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold">Add to Library</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <NewItemForm types={types} />
      </main>
    </div>
  );
}
