export default function Button({ 
    children, 
    onClick, 
    type = "button", 
    variant = "primary", 
    fullWidth = false,
    className = "" 
}) {
    const baseStyles = "font-semibold py-2.5 px-4 rounded-lg transition-all duration-150 text-sm tracking-wide flex items-center justify-center gap-2";
    
    const variants = {
        primary: "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-md shadow-primary-200 hover:shadow-lg hover:shadow-primary-200",
        outline: "bg-base-surface border border-base-border text-tx-muted hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200",
        danger: "bg-base-surface border border-base-border text-tx-muted hover:bg-danger-50 hover:text-danger-600 hover:border-danger-200"
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
        >
            {children}
        </button>
    );
}
