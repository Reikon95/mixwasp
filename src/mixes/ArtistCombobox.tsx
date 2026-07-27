import { searchArtists, useQuery } from "wasp/client/operations";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../client/components/ui/command";
import { Input } from "../client/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "../client/components/ui/popover";
import { useDebounce } from "../client/hooks/useDebounce";
import { cn } from "../client/utils";

type ArtistComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ArtistCombobox({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = "Search or create an artist",
}: ArtistComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const debouncedSearch = useDebounce(search.trim(), 250);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const { data: artists = [], isLoading } = useQuery(
    searchArtists,
    { query: debouncedSearch },
    { enabled: open },
  );

  const trimmedSearch = search.trim();
  const hasExactMatch = artists.some(
    (artist) => artist.name.toLowerCase() === trimmedSearch.toLowerCase(),
  );

  const selectArtist = (name: string) => {
    onChange(name);
    setSearch(name);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            value={search}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            className="pr-9"
            onChange={(event) => {
              const nextValue = event.target.value;
              setSearch(nextValue);
              onChange(nextValue);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              onBlur?.();
              window.setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          <ChevronsUpDown
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
            aria-hidden
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {isLoading && (
              <div className="text-muted-foreground py-6 text-center text-sm">
                Searching…
              </div>
            )}

            {!isLoading && trimmedSearch && !hasExactMatch && (
              <CommandGroup heading="New artist">
                <CommandItem
                  value={`create-${trimmedSearch}`}
                  onSelect={() => selectArtist(trimmedSearch)}
                >
                  <Plus className="size-4" aria-hidden />
                  Create &ldquo;{trimmedSearch}&rdquo;
                </CommandItem>
              </CommandGroup>
            )}

            {!isLoading && artists.length > 0 && (
              <CommandGroup
                heading={trimmedSearch ? "Matching artists" : "Artists"}
              >
                {artists.map((artist) => (
                  <CommandItem
                    key={artist.id}
                    value={artist.name}
                    onSelect={() => selectArtist(artist.name)}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        value === artist.name ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    {artist.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!isLoading && artists.length === 0 && !trimmedSearch && (
              <CommandEmpty>Type to search artists.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
