import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchEmails } from '@/hooks/useMailbox';

interface SearchBarProps {
  token: string;
  onSearchResults?: (results: any[]) => void;
  onClearSearch?: () => void;
  placeholder?: string;
}

export function SearchBar({ 
  token, 
  onSearchResults, 
  onClearSearch,
  placeholder = 'Buscar emails...'
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { searchEmails, clearSearch } = useSearchEmails(token);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery);
    } else if (debouncedQuery.trim().length === 0) {
      handleClear();
    }
  }, [debouncedQuery]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    
    try {
      await searchEmails(searchQuery);
      if (onSearchResults) {
        onSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching emails:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    clearSearch();
    if (onClearSearch) {
      onClearSearch();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      performSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-20 h-11"
          aria-label="Buscar emails"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" aria-label="Buscando..." />
          )}
          {query && !isSearching && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="text-xs text-muted-foreground mt-1 px-1">
          Digite pelo menos 2 caracteres para buscar
        </p>
      )}
    </form>
  );
}
