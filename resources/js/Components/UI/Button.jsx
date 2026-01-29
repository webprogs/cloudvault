import { forwardRef } from 'react';

const Button = forwardRef(({
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    children,
    icon,
    iconOnly = false,
    ...props
}, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variants = {
        primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary shadow-sm hover:shadow-md',
        secondary: 'bg-primary-light text-primary hover:bg-blue-100 focus:ring-primary',
        danger: 'bg-error text-white hover:bg-red-600 focus:ring-error shadow-sm hover:shadow-md',
        ghost: 'bg-transparent text-text-secondary hover:bg-gray-100 hover:text-text-primary focus:ring-gray-300',
        outline: 'border-2 border-border text-text-primary hover:bg-gray-50 hover:border-gray-300 focus:ring-primary',
        gradient: 'btn-gradient text-white focus:ring-primary shadow-md',
    };

    const sizes = {
        sm: iconOnly ? 'p-2' : 'px-3 py-1.5 text-sm',
        md: iconOnly ? 'p-2.5' : 'px-4 py-2.5 text-sm',
        lg: iconOnly ? 'p-3' : 'px-6 py-3 text-base',
    };

    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : (
                <>
                    {icon && <span className={!iconOnly && children ? 'mr-2' : ''}>{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
