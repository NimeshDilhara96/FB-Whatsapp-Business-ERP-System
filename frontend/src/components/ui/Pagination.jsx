import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const buildPageNumbers = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
};

const Pagination = ({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 20, 50],
  itemLabel = "items",
}) => {
  if (!pagination || !pagination.totalItems || pagination.totalItems <= 0) {
    return null;
  }

  const totalItems = Number(pagination.totalItems) || 0;
  const limit = Number(pagination.limit) || 10;
  const totalPages = Math.max(1, Number(pagination.totalPages) || Math.ceil(totalItems / limit) || 1);
  const currentPage = Math.min(Math.max(1, Number(pagination.currentPage) || 1), totalPages);

  // When onLimitChange is not provided (e.g. legacy caller) and everything fits on 1 page, hide controls
  if (!onLimitChange && totalPages <= 1) {
    return null;
  }

  const startItem = Math.min((currentPage - 1) * limit + 1, totalItems);
  const endItem = Math.min(currentPage * limit, totalItems);
  const pages = buildPageNumbers(currentPage, totalPages);

  const handlePageSelect = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    onPageChange(newPage);
  };

  return (
    <div className="border-t border-base-border-subtle pt-3.5 mt-4">
      {/* ───────── Mobile Pagination ───────── */}
      <div className="md:hidden flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-tx-subtle tabular-nums">
            Showing <span className="font-semibold text-tx-main">{startItem}–{endItem}</span> of{" "}
            <span className="font-semibold text-tx-main">{totalItems}</span> {itemLabel}
          </span>
          {onLimitChange && (
            <label className="flex items-center gap-1.5 text-xs text-tx-subtle">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                aria-label="Items per page"
                className="h-7 px-2 rounded-lg border border-base-border bg-base-surface text-xs font-semibold text-tx-main focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                {limitOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageSelect(currentPage - 1)}
              className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-base-border bg-base-surface text-xs font-semibold text-tx-main shadow-2xs transition-colors hover:bg-base-bg disabled:opacity-40 disabled:pointer-events-none"
            >
              <FiChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-xs text-tx-subtle tabular-nums">
              Page <span className="font-bold text-tx-main">{currentPage}</span> of{" "}
              <span className="font-bold text-tx-main">{totalPages}</span>
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageSelect(currentPage + 1)}
              className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-base-border bg-base-surface text-xs font-semibold text-tx-main shadow-2xs transition-colors hover:bg-base-bg disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ───────── Desktop Pagination ───────── */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-tx-subtle tabular-nums">
          <span>
            Showing <span className="font-semibold text-tx-main">{startItem}–{endItem}</span> of{" "}
            <span className="font-semibold text-tx-main">{totalItems}</span> {itemLabel}
          </span>
          {onLimitChange && (
            <>
              <span className="text-base-border">•</span>
              <label className="inline-flex items-center gap-1.5">
                <span>Rows per page</span>
                <select
                  value={limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  aria-label="Rows per page"
                  className="h-8 px-2 rounded-lg border border-base-border bg-base-surface text-xs font-semibold text-tx-main focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                  {limitOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageSelect(currentPage - 1)}
              className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-base-border bg-base-surface text-xs font-medium text-tx-main hover:bg-base-bg transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <FiChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>

            {pages.map((p, idx) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-8 px-1.5 inline-flex items-center justify-center text-xs text-tx-subtle select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageSelect(p)}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={`h-8 min-w-8 px-2.5 inline-flex items-center justify-center rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                    p === currentPage
                      ? "border-emerald-800 bg-emerald-800 text-white"
                      : "border-base-border bg-base-surface text-tx-main hover:bg-base-bg"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageSelect(currentPage + 1)}
              className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-base-border bg-base-surface text-xs font-medium text-tx-main hover:bg-base-bg transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
              <FiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
