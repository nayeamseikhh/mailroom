import { useEffect } from "react";

/**
 * Reusable modal dialog.
 * - Closes on Escape key press.
 * - Closes when clicking the backdrop (outside the dialog panel).
 *
 * @param {object}   props
 * @param {string}   props.title     - Dialog heading text.
 * @param {Function} props.onClose   - Callback to close the modal.
 * @param {boolean}  [props.saving]  - When true, Escape / backdrop clicks are ignored.
 * @param {React.ReactNode} props.children
 */
export default function Modal({ title, onClose, saving = false, children }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !saving) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  function handleBackdropMouseDown(event) {
    if (!saving && event.target === event.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4"
      onMouseDown={handleBackdropMouseDown}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      <section className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
            className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}
