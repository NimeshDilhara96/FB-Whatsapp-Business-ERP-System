export default function Input({ 
    label, 
    icon, 
    type = "text", 
    placeholder, 
    value, 
    onChange, 
    className = "",
    rightElement,
    name,
    disabled = false
}) {
    return (
        <div className={className}>
            {label && (
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-tx-main">
                        {label}
                    </label>
                    {rightElement && rightElement}
                </div>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tx-subtle">
                        {icon}
                    </div>
                )}
                <input
                    name={name}
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 text-sm text-tx-main bg-base-bg border border-base-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all placeholder-tx-subtle ${disabled ? 'opacity-60 cursor-not-allowed bg-base-surface' : ''}`}
                />
            </div>
        </div>
    );
}
