/**
 * Folder (list) sidebar.
 *
 * Props
 * -----
 * @param {Array}       lists            - All available list objects [{_id, name}].
 * @param {object|null} selectedList     - Currently active list object, or null = "All contacts".
 * @param {string}      activeListId     - _id of the active list ("" = all contacts).
 * @param {number}      folderCount      - Total number of folders.
 * @param {Function}    openCreateList   - Opens the create-folder modal.
 * @param {Function}    showAllContacts  - Resets the active folder to "All contacts".
 * @param {Function}    openFolder       - Activates a specific folder (receives list object).
 * @param {Function}    openEditList     - Opens the rename-folder modal (receives list object).
 * @param {Function}    handleDeleteList - Confirms and deletes a folder (receives list object).
 */
export default function FolderSidebar({
  lists,
  selectedList,
  activeListId,
  folderCount,
  openCreateList,
  showAllContacts,
  openFolder,
  openEditList,
  handleDeleteList,
}) {
  return (
    <aside className="lg:col-span-4 xl:col-span-3">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-gray-900">Contact folders</h2>
            <p className="mt-1 text-xs text-gray-500">
              Open a folder to view its contacts.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateList}
            title="Create folder"
            aria-label="Create new folder"
            className="rounded-lg border border-emerald-200/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20"
          >
            +
          </button>
        </div>

        {/* List */}
        <div className="p-3">
          {/* "All contacts" row */}
          <button
            type="button"
            onClick={showAllContacts}
            className={`mb-2 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm ${
              !selectedList
                ? "bg-emerald-400/15 font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-200/20"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-3">
              <span aria-hidden="true">👥</span>
              All contacts
            </span>

            {!selectedList && (
              <span aria-hidden="true" className="text-xs">
                ✓
              </span>
            )}
          </button>

          {/* Folder rows */}
          {lists.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-2xl" aria-hidden="true">
                📁
              </p>
              <p className="mt-2 text-sm font-medium text-gray-700">
                No folders yet
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Create a folder to organize your contacts.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {lists.map((list) => {
                const active = activeListId === list._id;

                return (
                  <div
                    key={list._id}
                    className={`group flex items-center gap-1 rounded-xl ${
                      active
                        ? "bg-emerald-400/15 ring-1 ring-inset ring-emerald-200/20"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Folder name button */}
                    <button
                      type="button"
                      onClick={() => openFolder(list)}
                      className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left text-sm ${
                        active
                          ? "font-semibold text-emerald-100"
                          : "text-gray-700"
                      }`}
                    >
                      <span aria-hidden="true">{active ? "📂" : "📁"}</span>

                      <span className="min-w-0 flex-1 truncate">
                        {list.name}
                      </span>

                      {active && (
                        <span className="text-xs" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>

                    {/* Rename */}
                    <button
                      type="button"
                      title="Rename folder"
                      aria-label={`Rename ${list.name}`}
                      onClick={() => openEditList(list)}
                      className="rounded-lg px-2 py-2 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-emerald-300"
                    >
                      ✎
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      title="Delete folder"
                      aria-label={`Delete ${list.name}`}
                      onClick={() => handleDeleteList(list)}
                      className="mr-2 rounded-lg px-2 py-2 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
          <p className="text-xs text-gray-500">
            {folderCount} folder{folderCount === 1 ? "" : "s"} available
          </p>
        </div>
      </section>
    </aside>
  );
}
