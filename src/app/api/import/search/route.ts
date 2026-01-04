import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { mediaType } from "@/db/schema";
import { getProvider } from "@/lib/providers";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	// Verify authentication
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const typeId = searchParams.get("typeId");
	const query = searchParams.get("q");

	if (!typeId || !query) {
		return NextResponse.json(
			{ error: "Missing typeId or q parameter" },
			{ status: 400 },
		);
	}

	// Get the media type to find the provider
	const type = await db.query.mediaType.findFirst({
		where: and(eq(mediaType.id, typeId), eq(mediaType.userId, session.user.id)),
	});

	if (!type) {
		return NextResponse.json({ error: "Media type not found" }, { status: 404 });
	}

	if (!type.providerKey) {
		return NextResponse.json(
			{ error: "This media type does not have a search provider configured" },
			{ status: 400 },
		);
	}

	const provider = getProvider(type.providerKey);
	if (!provider) {
		return NextResponse.json(
			{ error: `Provider ${type.providerKey} not found` },
			{ status: 500 },
		);
	}

	try {
		const results = await provider.search(
			query,
			type.providerConfig as Record<string, unknown> | undefined,
		);
		return NextResponse.json({ results });
	} catch (error) {
		console.error("Provider search error:", error);
		return NextResponse.json(
			{ error: "Search failed" },
			{ status: 500 },
		);
	}
}
