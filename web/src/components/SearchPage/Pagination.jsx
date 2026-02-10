import { IoChevronBack, IoChevronForward } from "react-icons/io5";

export default function SearchPagination({
  canPaginate,
  currentPage,
  loading,
  totalPages,
  goToPage,
}) {
  return (
    <>
      {canPaginate && (
        <nav className="pagination-inline" aria-label="Search pagination">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={loading || currentPage === 1}
            className="pagination-icon-btn"
            aria-label="Previous page"
          >
            <IoChevronBack aria-hidden="true" />
          </button>
          <div className="pagination-status" aria-live="polite">
            <span className="pagination-pill">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={loading || currentPage === totalPages}
            className="pagination-icon-btn"
            aria-label="Next page"
          >
            <IoChevronForward aria-hidden="true" />
          </button>
        </nav>
      )}
    </>
  );
}
