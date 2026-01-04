import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { seedDefaultTypesForUser } from "@/lib/seed-default-types";

export default async function AppLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/sign-in");
	}

	// Seed default media types for new users
	await seedDefaultTypesForUser(session.user.id);

	return <>{children}</>;
}
