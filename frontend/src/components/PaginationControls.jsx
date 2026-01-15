import React from "react";

const PAGE_SIZES = [10, 20, 50, 100];

export default function PaginationControls({
  total,
  limit,
  offset,
  onPageChange,
  onLimitChange,
}) {
  const safeLimit = limit || 20;
  const safeOffset = offset || 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const currentPage = Math.floor(safeOffset / safeLimit) + 1;
  const start = total === 0 ? 0 : safeOffset + 1;
  const end = Math.min(safeOffset + safeLimit, total);

  const goPrev = () => onPageChange(Math.max(0, safeOffset - safeLimit));
  const goNext = () => onPageChange(Math.min((totalPages - 1) * safeLimit, safeOffset + safeLimit));

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing {start}-{end} of {total}
      </div>
      <div className="pagination-controls">
        <label className="pagination-size">
          Rows
          <select value={safeLimit} onChange={(event) => onLimitChange(Number(event.target.value))}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button className="page-button" type="button" onClick={goPrev} disabled={currentPage <= 1}>
          Prev
        </button>
        <span className="page-status">
          {currentPage} / {totalPages}
        </span>
        <button
          className="page-button"
          type="button"
          onClick={goNext}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
