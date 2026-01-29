import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { useDebouncedCallback } from 'use-debounce';
import VoiceSearch from './VoiceSearch';

export default function SearchBar({ initialValue = '', placeholder = 'Search files...' }) {
    const [search, setSearch] = useState(initialValue);
    const [isFocused, setIsFocused] = useState(false);

    const debouncedSearch = useDebouncedCallback((value) => {
        router.get(window.location.pathname, {
            ...Object.fromEntries(new URLSearchParams(window.location.search)),
            search: value || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, 300);

    const handleChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        debouncedSearch(value);
    };

    const handleVoiceResult = useCallback((transcript) => {
        setSearch(transcript);
        debouncedSearch(transcript);
    }, [debouncedSearch]);

    const handleClear = () => {
        setSearch('');
        debouncedSearch('');
    };

    return (
        <div className="relative flex items-center">
            <div className={`relative flex-1 transition-all duration-200 ${isFocused ? 'scale-[1.02]' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`h-5 w-5 transition-colors ${isFocused ? 'text-primary' : 'text-text-secondary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className={`block w-full pl-12 pr-24 py-3 border rounded-xl bg-card text-text-primary placeholder-text-secondary transition-all duration-200 ${
                        isFocused
                            ? 'border-primary ring-4 ring-primary/10 shadow-lg'
                            : 'border-border hover:border-gray-300 shadow-sm'
                    }`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                    {search && (
                        <button
                            onClick={handleClear}
                            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    <VoiceSearch onResult={handleVoiceResult} />
                </div>
            </div>
        </div>
    );
}
