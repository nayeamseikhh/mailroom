import Modal from "./Modal.jsx";

/**
 * Modal form for creating or renaming a contact folder (list).
 *
 * Props
 * -----
 * @param {boolean}     listModal        - Whether the modal is open.
 * @param {object|null} editingList      - List being renamed (null = create mode).
 * @param {boolean}     saving           - True while the API call is in flight.
 * @param {Function}    onClose          - Unified close callback (handles both states).
 * @param {Function}    handleListSubmit - Form submit handler (receives event).
 * @param {string}      listName         - Controlled input value.
 * @param {Function}    setListName      - State updater for the name input.
 */
export default function ListFormModal({
  listModal,
  editingList,
  saving,
  onClose,
  handleListSubmit,
  listName,
  setListName,
}) {
  if (!listModal) return null;

  return (
    <Modal
      title={editingList ? "Rename folder" : "Create contact folder"}
      onClose={onClose}
      saving={saving}
    >
      <form onSubmit={handleListSubmit} className="space-y-5" noValidate>
        {/* Folder name */}
        <div>
          <label
            htmlFor="folder-name"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Folder name <span className="text-red-500">*</span>
          </label>

          <input
            id="folder-name"
            type="text"
            required
            autoFocus
            maxLength={120}
            value={listName}
            onChange={(event) => setListName(event.target.value)}
            placeholder="e.g. Newsletter Subscribers"
            className="w-full rounded-xl border border-emerald-200/30 px-4 py-3 text-sm outline-none focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-300/20"
          />

          <p className="mt-2 text-xs text-gray-500">
            Use folders to group contacts for easier campaign preparation.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-emerald-200/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : editingList
                ? "Save folder"
                : "Create folder"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
