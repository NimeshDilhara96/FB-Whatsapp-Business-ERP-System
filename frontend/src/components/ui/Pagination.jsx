import React from 'react';
import Button from './Button';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || !pagination.totalPages || pagination.totalPages <= 1) {
    return null;
  }

  const { currentPage, totalPages, totalItems } = pagination;

  return (
    <div className="flex items-center justify-between border-t border-base-border-subtle pt-4 mt-4">
      <div className="text-sm text-tx-subtle">
        Showing page <span className="font-medium text-tx-main">{currentPage}</span> of{" "}
        <span className="font-medium text-tx-main">{totalPages}</span>
        {" "}(<span className="font-medium text-tx-main">{totalItems}</span> total items)
      </div>
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
