"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface MediaType {
	id: string;
	name: string;
	slug: string;
}

interface LibraryFiltersProps {
	types: MediaType[];
}

const STATUSES = [
	{ value: "planned", label: "Planned" },
	{ value: "started", label: "In Progress" },
	{ value: "finished", label: "Finished" },
	{ value: "dropped", label: "Dropped" },
];

export function LibraryFilters({ types }: LibraryFiltersProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const currentType = searchParams.get("type");
	const currentStatus = searchParams.get("status");

	const updateFilter = (key: string, value: string | null) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
		router.push(`/library?${params.toString()}`);
	};

	return (
		<div className="flex flex-wrap gap-2 mb-6">
			<Button
				variant={!currentType ? "default" : "outline"}
				size="sm"
				onClick={() => updateFilter("type", null)}
			>
				All Types
			</Button>
			{types.map((type) => (
				<Button
					key={type.id}
					variant={currentType === type.slug ? "default" : "outline"}
					size="sm"
					onClick={() => updateFilter("type", type.slug)}
				>
					{type.name}
				</Button>
			))}

			<div className="w-px h-6 bg-border mx-2 self-center" />

			<Button
				variant={!currentStatus ? "default" : "outline"}
				size="sm"
				onClick={() => updateFilter("status", null)}
			>
				All Status
			</Button>
			{STATUSES.map((status) => (
				<Button
					key={status.value}
					variant={currentStatus === status.value ? "default" : "outline"}
					size="sm"
					onClick={() => updateFilter("status", status.value)}
				>
					{status.label}
				</Button>
			))}
		</div>
	);
}
