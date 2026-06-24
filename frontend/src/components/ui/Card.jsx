export default function Card({ children, className = "" }) {
    return (
        <div className={`bg-base-surface p-6 rounded-2xl shadow-sm border border-base-border-subtle ${className}`}>
            {children}
        </div>
    );
}
