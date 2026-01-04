"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { importItem, createManualItem } from "./actions";
import type { ProviderSearchResult } from "@/lib/providers/types";

interface MediaType {
	id: string;
	name: string;
	slug: string;
	providerKey: string | null;
}

interface NewItemFormProps {
	types: MediaType[];
}

export function NewItemForm({ types }: NewItemFormProps) {
	const [selectedType, setSelectedType] = useState<MediaType | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<ProviderSearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showManualForm, setShowManualForm] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleSearch = async () => {
		if (!selectedType || !searchQuery.trim()) return;

		setIsSearching(true);
		try {
			const response = await fetch(
				`/api/import/search?typeId=${encodeURIComponent(selectedType.id)}&q=${encodeURIComponent(searchQuery)}`,
			);
			const data = await response.json();
			if (data.results) {
				setSearchResults(data.results);
			}
		} catch (error) {
			console.error("Search failed:", error);
		} finally {
			setIsSearching(false);
		}
	};

	const handleImport = (result: ProviderSearchResult) => {
		if (!selectedType) return;

		const formData = new FormData();
		formData.set("typeId", selectedType.id);
		formData.set("externalId", result.externalId);

		startTransition(() => {
			importItem(formData);
		});
	};

	if (types.length === 0) {
		return (
			<Card>
				<CardContent className="py-8 text-center">
					<p className="text-muted-foreground mb-4">
						You haven't set up any media types yet. Media types will be created automatically when you sign in.
					</p>
				</CardContent>
			</Card>
		);
	}

	if (!selectedType) {
		return (
			<div className="space-y-4">
				<h2 className="text-lg font-medium">Choose media type</h2>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
					{types.map((type) => (
						<Button
							key={type.id}
							variant="outline"
							className="h-auto py-4 flex flex-col gap-1"
							onClick={() => {
								setSelectedType(type);
								setSearchResults([]);
								setSearchQuery("");
								setShowManualForm(false);
							}}
						>
							<span className="font-medium">{type.name}</span>
							{type.providerKey && (
								<span className="text-xs text-muted-foreground">Search available</span>
							)}
						</Button>
					))}
				</div>
			</div>
		);
	}

	if (showManualForm) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-medium">Add {selectedType.name} manually</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setShowManualForm(false);
							setSelectedType(null);
						}}
					>
						Back
					</Button>
				</div>

				<form action={createManualItem} className="space-y-4">
					<input type="hidden" name="typeId" value={selectedType.id} />

					<div className="space-y-2">
						<Label htmlFor="title">Title *</Label>
						<Input id="title" name="title" required placeholder="Enter title" />
					</div>

					<div className="space-y-2">
						<Label htmlFor="subtitle">Subtitle / Author</Label>
						<Input id="subtitle" name="subtitle" placeholder="Optional" />
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea id="description" name="description" placeholder="Optional" rows={4} />
					</div>

					<Button type="submit" disabled={isPending}>
						{isPending ? "Adding..." : "Add to Library"}
					</Button>
				</form>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-medium">Add {selectedType.name}</h2>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						setSelectedType(null);
						setSearchResults([]);
						setSearchQuery("");
					}}
				>
					Change type
				</Button>
			</div>

			{selectedType.providerKey ? (
				<>
					<div className="flex gap-2">
						<Input
							placeholder={`Search for ${selectedType.name.toLowerCase()}...`}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						/>
						<Button onClick={handleSearch} disabled={isSearching}>
							{isSearching ? "Searching..." : "Search"}
						</Button>
					</div>

					{searchResults.length > 0 && (
						<div className="space-y-3">
							{searchResults.map((result) => (
								<Card
									key={result.externalId}
									className="cursor-pointer hover:bg-accent/50 transition-colors"
									onClick={() => handleImport(result)}
								>
									<CardContent className="p-4 flex gap-4">
										{result.imageUrl && (
											<img
												src={result.imageUrl}
												alt=""
												className="w-16 h-24 object-cover rounded flex-shrink-0"
											/>
										)}
										<div className="flex-1 min-w-0">
											<h3 className="font-medium truncate">{result.title}</h3>
											{result.subtitle && (
												<p className="text-sm text-muted-foreground truncate">
													{result.subtitle}
												</p>
											)}
											{result.year && (
												<p className="text-sm text-muted-foreground">{result.year}</p>
											)}
											{result.description && (
												<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
													{result.description}
												</p>
											)}
										</div>
										<Button
											variant="secondary"
											size="sm"
											className="flex-shrink-0 self-center"
											disabled={isPending}
										>
											{isPending ? "Adding..." : "Add"}
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					)}

					<div className="pt-4 border-t">
						<Button variant="outline" onClick={() => setShowManualForm(true)}>
							Add manually instead
						</Button>
					</div>
				</>
			) : (
				<div className="space-y-4">
					<p className="text-sm text-muted-foreground">
						This media type doesn't have search enabled. Add items manually.
					</p>
					<Button onClick={() => setShowManualForm(true)}>Add manually</Button>
				</div>
			)}
		</div>
	);
}
