import { useState, useRef, useEffect } from 'react';

export default function Dropdown({
    trigger,
    children,
    align = 'right',
    width = 'w-48',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const alignmentClasses = {
        left: 'left-0',
        right: 'right-0',
        center: 'left-1/2 -translate-x-1/2',
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={`absolute z-50 mt-2 ${width} ${alignmentClasses[align]} bg-card rounded-xl shadow-xl border border-border/80 py-1.5 slide-up`}
                >
                    <div onClick={() => setIsOpen(false)}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

export function DropdownItem({ onClick, children, danger = false, disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full px-4 py-2.5 text-left text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                danger
                    ? 'text-error hover:bg-red-50'
                    : 'text-text-primary hover:bg-gray-50'
            }`}
        >
            {children}
        </button>
    );
}

export function DropdownDivider() {
    return <div className="my-1.5 border-t border-border" />;
}
