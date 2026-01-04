import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { mediaItem, mediaType, entry } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LibraryFilters } from "./library-filters";
import { signOut } from "@/lib/auth-client";
import { SignOutButton } from "./sign-out-button";

export default async function LibraryPage({
	searchParams,
}: {
	searchParams: Promise<{ type?: string; status?: string }>;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) return null;

	const params = await searchParams;

	// Get user's media types for filtering
	const types = await db.query.mediaType.findMany({
		where: eq(mediaType.userId, session.user.id),
		orderBy: (mediaType, { asc }) => [asc(mediaType.name)],
	});

	// Get user's items with their latest entry
	const items = await db.query.mediaItem.findMany({
		where: eq(mediaItem.userId, session.user.id),
		with: {
			type: true,
			entries: {
				orderBy: (entry, { desc }) => [desc(entry.createdAt)],
				limit: 1,
			},
		},
		orderBy: (mediaItem, { desc }) => [desc(mediaItem.updatedAt)],
	});

	// Apply filters
	let filteredItems = items;
	if (params.type) {
		filteredItems = filteredItems.filter((item) => item.type.slug === params.type);
	}
	if (params.status) {
		filteredItems = filteredItems.filter(
			(item) => item.entries[0]?.status === params.status,
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
				<div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
					<Link href="/library" className="text-xl font-semibold hover:opacity-80">
						Reviews
					</Link>
					<div className="flex items-center gap-4">
						<span className="text-sm text-muted-foreground">
							{session.user.name || session.user.email}
						</span>
						<SignOutButton />
					</div>
				</div>
			</header>
			<main className="max-w-7xl mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold">Library</h2>
					<Link href="/items/new">
						<Button>Add Item</Button>
					</Link>
				</div>

				<LibraryFilters types={types} />

				{filteredItems.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-muted-foreground mb-4">
							{items.length === 0
								? "Your library is empty. Add some media to get started."
								: "No items match your filters."}
						</p>
						{items.length === 0 && (
							<Link href="/items/new">
								<Button variant="outline">Add your first item</Button>
							</Link>
						)}
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
						{filteredItems.map((item) => (
							<Link
								key={item.id}
								href={`/items/${item.id}`}
								className="group block"
							>
								<div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2">
									{item.imageUrl ? (
										<img
											src={item.imageUrl}
											alt=""
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
											{item.title}
										</div>
									)}
								</div>
								<h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
									{item.title}
								</h3>
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<span>{item.type.name}</span>
									{item.entries[0] && (
										<>
											<span>·</span>
											<span className="capitalize">{item.entries[0].status}</span>
										</>
									)}
								</div>
							</Link>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
