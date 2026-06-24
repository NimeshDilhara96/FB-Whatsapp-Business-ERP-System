export default function Select({ 
    label, 
    name,
    value, 
    onChange, 
    options = [], 
    className = ""
}) {
    return (
        <div className={className}>
            {label && (
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-tx-main">
                        {label}
                    </label>
                </div>
            )}
            <div className="relative">
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full pl-4 pr-10 py-2.5 text-sm text-tx-main bg-base-bg border border-base-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                >
                    <option value="" disabled>Select {label}</option>
                    {options.map((option, index) => (
                        <option key={index} value={option.value || option}>
                            {option.label || option}
                        </option>
                    ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-tx-subtle">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
