import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for handling page-level drag-and-drop of external files.
 * Distinguishes between external file drags (from desktop) and internal drags (file/folder moves).
 *
 * @param {Object} options
 * @param {Function} options.onFileDrop - Callback when files are dropped
 * @param {boolean} options.enabled - Whether drag-drop is enabled (default: true)
 * @returns {Object} { isDragOver, dragHandlers }
 */
export default function usePageDropzone({ onFileDrop, enabled = true }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const dragCounter = useRef(0);

    /**
     * Determine if the drag event is from external files (desktop)
     * and not from internal drag operations (like file/folder moves).
     */
    const isExternalFileDrag = useCallback((e) => {
        // External files have 'Files' type but not 'application/json' (used for internal moves)
        return e.dataTransfer.types.includes('Files') &&
               !e.dataTransfer.types.includes('application/json');
    }, []);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!enabled) return;

        // Only respond to external file drags
        if (!isExternalFileDrag(e)) return;

        dragCounter.current++;

        if (dragCounter.current === 1) {
            setIsDragOver(true);
        }
    }, [enabled, isExternalFileDrag]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!enabled) return;

        dragCounter.current--;

        if (dragCounter.current === 0) {
            setIsDragOver(false);
        }
    }, [enabled]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!enabled) return;

        // Set dropEffect to indicate copy operation
        if (isExternalFileDrag(e)) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }, [enabled, isExternalFileDrag]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        // Reset drag counter
        dragCounter.current = 0;
        setIsDragOver(false);

        if (!enabled) return;

        // Only process external file drops
        if (!isExternalFileDrag(e)) return;

        const files = Array.from(e.dataTransfer.files);

        if (files.length > 0 && onFileDrop) {
            onFileDrop(files);
        }
    }, [enabled, isExternalFileDrag, onFileDrop]);

    // Reset state when disabled
    useEffect(() => {
        if (!enabled) {
            dragCounter.current = 0;
            setIsDragOver(false);
        }
    }, [enabled]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            dragCounter.current = 0;
        };
    }, []);

    const dragHandlers = {
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDragOver: handleDragOver,
        onDrop: handleDrop,
    };

    return {
        isDragOver,
        dragHandlers,
    };
}
