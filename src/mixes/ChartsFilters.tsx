import { searchGenres, searchTags, useQuery } from "wasp/client/operations";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "../client/components/ui/button";
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

export type ChartFiltersState = {
  q: string;
  genreId?: number;
  genreName?: string;
  tagId?: number;
  tagName?: string;
};

type NamedItem = {
  id: number;
  name: string;
};

type FilterPickComboboxProps = {
  label: string;
  valueId?: number;
  valueName?: string;
  onChange: (next: { id?: number; name?: string }) => void;
  searchQuery: typeof searchGenres | typeof searchTags;
  placeholder: string;
};

function FilterPickCombobox({
  label,
  valueId,
  valueName,
  onChange,
  searchQuery,
  placeholder,
}: FilterPickComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 250);

  const { data: matches = [], isLoading } = useQuery(
    searchQuery,
    { query: debouncedSearch },
    { enabled: open },
  );

  const items = matches as NamedItem[];

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSearch("");
        }
      }}
    >
      <PopoverAnchor asChild>
        <div className="relative min-w-0 flex-1 sm:max-w-[11rem]">
          <button
            type="button"
            aria-label={label}
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={cn(
              "border-input bg-background hover:bg-muted/40 flex h-9 w-full items-center justify-between rounded-md border px-3 text-left text-sm shadow-sm transition-colors",
              !valueName && "text-muted-foreground",
            )}
          >
            <span className="truncate">{valueName ?? placeholder}</span>
            <ChevronsUpDown className="text-muted-foreground size-4 shrink-0 opacity-50" />
          </button>
          {valueId !== undefined && (
            <button
              type="button"
              aria-label={`Clear ${label.toLowerCase()}`}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-8 -translate-y-1/2 rounded-sm p-0.5"
              onClick={(event) => {
                event.stopPropagation();
                onChange({});
              }}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 size-4 shrink-0 opacity-50" />
            <Input
              value={search}
              autoFocus
              placeholder={`Search ${label.toLowerCase()}…`}
              className="border-0 shadow-none focus-visible:ring-0"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <CommandList>
            {isLoading && (
              <div className="text-muted-foreground py-6 text-center text-sm">
                Searching…
              </div>
            )}
            {!isLoading && items.length === 0 && (
              <CommandEmpty>No matches.</CommandEmpty>
            )}
            {!isLoading && items.length > 0 && (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => {
                      onChange({ id: item.id, name: item.name });
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        valueId === item.id ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ChartsFilters({
  filters,
  onChange,
}: {
  filters: ChartFiltersState;
  onChange: (next: ChartFiltersState) => void;
}) {
  const hasActiveFilters =
    filters.q.trim().length > 0 ||
    filters.genreId !== undefined ||
    filters.tagId !== undefined;

  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.q}
          onChange={(event) =>
            onChange({ ...filters, q: event.target.value })
          }
          placeholder="Search title, artist, promoter…"
          className="pl-9"
          aria-label="Search mixes"
        />
      </div>

      <FilterPickCombobox
        label="Genre"
        placeholder="Genre"
        valueId={filters.genreId}
        valueName={filters.genreName}
        searchQuery={searchGenres}
        onChange={({ id, name }) =>
          onChange({
            ...filters,
            genreId: id,
            genreName: name,
          })
        }
      />

      <FilterPickCombobox
        label="Tag"
        placeholder="Tag"
        valueId={filters.tagId}
        valueName={filters.tagName}
        searchQuery={searchTags}
        onChange={({ id, name }) =>
          onChange({
            ...filters,
            tagId: id,
            tagName: name,
          })
        }
      />

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start sm:self-auto"
          onClick={() => onChange({ q: "" })}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
