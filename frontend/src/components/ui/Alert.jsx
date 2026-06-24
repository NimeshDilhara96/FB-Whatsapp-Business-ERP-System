export default function Alert({ type = "error", message, className = "" }) {
    if (!message) return null;

    const styles = {
        error: "bg-danger-50 border-danger-200 text-danger-600",
        success: "bg-primary-50 border-primary-200 text-primary-700"
    };

    const icons = {
        error: (
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
        ),
        success: (
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        )
    };

    return (
        <div className={`flex items-center gap-2.5 border text-sm rounded-lg px-4 py-3 ${styles[type]} ${className}`}>
            {icons[type]}
            <span>{message}</span>
        </div>
    );
}
