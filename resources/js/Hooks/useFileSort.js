import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

export default function useFileSort(initialSortBy = 'created_at', initialSortOrder = 'desc') {
    const [sortBy, setSortBy] = useState(initialSortBy);
    const [sortOrder, setSortOrder] = useState(initialSortOrder);

    const sortOptions = [
        { value: 'name', label: 'Name' },
        { value: 'created_at', label: 'Date uploaded' },
        { value: 'size', label: 'Size' },
        { value: 'extension', label: 'Type' },
    ];

    const handleSort = useCallback((newSortBy) => {
        let newSortOrder = 'asc';

        // If clicking the same column, toggle the order
        if (newSortBy === sortBy) {
            newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            // Default order for different columns
            newSortOrder = newSortBy === 'created_at' || newSortBy === 'size' ? 'desc' : 'asc';
        }

        setSortBy(newSortBy);
        setSortOrder(newSortOrder);

        // Update URL and reload data
        router.get(window.location.pathname, {
            ...Object.fromEntries(new URLSearchParams(window.location.search)),
            sort_by: newSortBy,
            sort_order: newSortOrder,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [sortBy, sortOrder]);

    const getSortIcon = useCallback((column) => {
        if (column !== sortBy) return null;
        return sortOrder === 'asc' ? '↑' : '↓';
    }, [sortBy, sortOrder]);

    return {
        sortBy,
        sortOrder,
        sortOptions,
        handleSort,
        getSortIcon,
    };
}
