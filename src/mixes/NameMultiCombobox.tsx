import { searchGenres, searchTags, useQuery } from "wasp/client/operations";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

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

type NamedItem = {
  id: number;
  name: string;
};

type NameSearchQuery = typeof searchGenres | typeof searchTags;

type NameMultiComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  searchQuery: NameSearchQuery;
  singularLabel: string;
  pluralLabel: string;
};

type ComboboxFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
};

function parseNames(value: string): string[] {
  if (!value.trim()) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(",")
        .map((part) => part.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ];
}

function serializeNames(names: string[]): string {
  return names.join(", ");
}

function namesEqual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function NameMultiCombobox({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = "Search or create",
  searchQuery,
  singularLabel,
  pluralLabel,
}: NameMultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 250);
  const selected = parseNames(value);

  const { data: matches = [], isLoading } = useQuery(
    searchQuery,
    { query: debouncedSearch },
    { enabled: open },
  );

  const trimmedSearch = search.trim().replace(/\s+/g, " ");
  const alreadySelected = selected.some((name) =>
    namesEqual(name, trimmedSearch),
  );
  const namedMatches = matches as NamedItem[];
  const hasExactMatch = namedMatches.some((item) =>
    namesEqual(item.name, trimmedSearch),
  );
  const availableMatches = namedMatches.filter(
    (item) => !selected.some((name) => namesEqual(name, item.name)),
  );

  const addName = (name: string) => {
    const normalized = name.trim().replace(/\s+/g, " ");
    if (!normalized) {
      return;
    }
    if (selected.some((existing) => namesEqual(existing, normalized))) {
      setSearch("");
      return;
    }

    onChange(serializeNames([...selected, normalized]));
    setSearch("");
    setOpen(true);
  };

  const removeName = (name: string) => {
    onChange(
      serializeNames(
        selected.filter((existing) => !namesEqual(existing, name)),
      ),
    );
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Backspace" && !search && selected.length > 0) {
      removeName(selected[selected.length - 1]);
      return;
    }

    if ((event.key === "Enter" || event.key === ",") && trimmedSearch) {
      event.preventDefault();
      addName(trimmedSearch);
    }
  };

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <span
              key={name.toLowerCase()}
              className="bg-muted text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              {name}
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeName(name)}
                className="text-muted-foreground hover:text-foreground rounded-full"
                aria-label={`Remove ${name}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

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
                setSearch(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                onBlur?.();
                window.setTimeout(() => setOpen(false), 150);
              }}
              onKeyDown={onInputKeyDown}
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

              {!isLoading &&
                trimmedSearch &&
                !hasExactMatch &&
                !alreadySelected && (
                  <CommandGroup heading={`New ${singularLabel}`}>
                    <CommandItem
                      value={`create-${trimmedSearch}`}
                      onSelect={() => addName(trimmedSearch)}
                    >
                      <Plus className="size-4" aria-hidden />
                      Create &ldquo;{trimmedSearch}&rdquo;
                    </CommandItem>
                  </CommandGroup>
                )}

              {!isLoading && availableMatches.length > 0 && (
                <CommandGroup
                  heading={
                    trimmedSearch
                      ? `Matching ${pluralLabel}`
                      : pluralLabel.charAt(0).toUpperCase() +
                        pluralLabel.slice(1)
                  }
                >
                  {availableMatches.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => addName(item.name)}
                    >
                      <Check className={cn("size-4 opacity-0")} aria-hidden />
                      {item.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!isLoading &&
                availableMatches.length === 0 &&
                !trimmedSearch && (
                  <CommandEmpty>Type to search {pluralLabel}.</CommandEmpty>
                )}

              {!isLoading &&
                availableMatches.length === 0 &&
                trimmedSearch &&
                (hasExactMatch || alreadySelected) && (
                  <CommandEmpty>
                    {alreadySelected ? "Already added." : "No other matches."}
                  </CommandEmpty>
                )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function GenreCombobox(props: ComboboxFieldProps) {
  return (
    <NameMultiCombobox
      {...props}
      searchQuery={searchGenres}
      singularLabel="genre"
      pluralLabel="genres"
      placeholder={props.placeholder ?? "Search or create genres"}
    />
  );
}

export function TagCombobox(props: ComboboxFieldProps) {
  return (
    <NameMultiCombobox
      {...props}
      searchQuery={searchTags}
      singularLabel="tag"
      pluralLabel="tags"
      placeholder={props.placeholder ?? "Search or create tags"}
    />
  );
}
