import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/library");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-5xl font-bold tracking-tight">Reviews</h1>
        <p className="text-xl text-muted-foreground">
          A personal system to track, reflect on, and compare the media you
          consume over time.
        </p>
        <Link href="/sign-in" className="mt-4">
          <Button size="lg">Get Started</Button>
        </Link>
      </div>
    </div>
  );
}
