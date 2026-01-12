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
        <div className="mx-auto mt-6 flex max-w-5xl flex-col items-center gap-3 text-sm text-[var(--ink-700)] sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={loading || currentPage === 1}
            className="inline-flex items-center rounded-md border border-[rgba(15,59,46,0.25)] bg-white px-3 py-1.5 font-medium text-[var(--ink-700)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={loading || currentPage === totalPages}
            className="inline-flex items-center rounded-md border border-[rgba(15,59,46,0.25)] bg-white px-3 py-1.5 font-medium text-[var(--ink-700)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
