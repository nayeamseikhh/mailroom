import {
  getListId,
  getContactName,
  getStatusClass,
  STATUS_OPTIONS,
} from "../../../utils/contactUtils.js";

/**
 * Contacts table with search, status filter, bulk-select, CSV export and pagination.
 *
 * Props
 * -----
 * @param {Array}    contacts               - Current page of contact objects.
 * @param {Array}    lists                  - All list objects [{_id, name}].
 * @param {object|null} selectedList        - Currently active folder, or null.
 * @param {object}   pagination             - { page, pages, total, limit }
 * @param {boolean}  loading                - True while contacts are being fetched.
 * @param {string}   search                 - Search input value.
 * @param {Function} setSearch              - Updates search state.
 * @param {string}   statusFilter           - Active status filter value.
 * @param {Function} setStatusFilter        - Updates status filter state.
 * @param {number}   selectedCount          - Number of selected contacts.
 * @param {Array}    selectedContacts       - Array of selected contact _id strings.
 * @param {Function} toggleSelectAll        - Toggles all subscribed contacts on this page.
 * @param {Function} toggleContactSelection - Toggles a single contact (receives _id).
 * @param {Function} exportSelectedEmails   - Exports selected contacts as CSV.
 * @param {Function} openAddContact         - Opens the create-contact modal.
 * @param {Function} openEditContact        - Opens the edit-contact modal (receives contact).
 * @param {Function} handleDeleteContact    - Confirms and deletes a contact (receives contact).
 * @param {Function} openFolder             - Navigates to a folder (receives list object).
 * @param {number}   page                   - Current pagination page number.
 * @param {Function} setPage                - Updates page state.
 */
export default function ContactsTable({
  contacts,
  lists,
  selectedList,
  pagination,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  sort,
  setSort,
  selectedCount,
  selectedContacts,
  toggleSelectAll,
  toggleContactSelection,
  exportSelectedEmails,
  openAddContact,
  openEditContact,
  handleDeleteContact,
  openFolder,
  page,
  setPage,
  onImportClick,
  importing,
}) {
  // Determine whether every visible subscribed contact is selected.
  const subscribedContacts = contacts.filter(
    (contact) => contact.status === "Subscribed",
  );
  const allSubscribedSelected =
    subscribedContacts.length > 0 &&
    subscribedContacts.every((contact) =>
      selectedContacts.includes(contact._id),
    );

  return (
    <section className="min-w-0 lg:col-span-8 xl:col-span-9">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* ── Table header ── */}
        <div className="border-b border-gray-100 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedList ? selectedList.name : "All contacts"}
                </h2>

                {selectedList && (
                  <span className="rounded-full border border-emerald-200/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                    Folder opened
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {pagination.total} contact
                {pagination.total === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onImportClick}
                disabled={importing}
                className="rounded-xl border border-emerald-200/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20 disabled:opacity-50"
              >
                {importing ? "Preparing import..." : "Import contacts"}
              </button>
              <button
                type="button"
                onClick={openAddContact}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                + Add contact
              </button>
            </div>
          </div>
          {/* Search + Status filter */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="contact-search" className="sr-only">
                Search contacts
              </label>

              <input
                id="contact-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email or company…"
                className="w-full rounded-xl border border-emerald-200/30 bg-emerald-950/40 px-4 py-3 text-sm outline-none transition focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-300/20"
              />
            </div>

            <div>
              <label htmlFor="contact-status" className="sr-only">
                Filter by status
              </label>

              <select
                id="contact-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-xl border border-emerald-200/30 bg-emerald-950/40 px-3 py-3 text-sm outline-none focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-300/20"
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contact-sort" className="sr-only">Sort contacts</label>
              <select
                id="contact-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="w-full rounded-xl border border-emerald-200/30 bg-emerald-950/40 px-3 py-3 text-sm outline-none focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-300/20"
              >
                <option value="createdAt:desc">Newest first</option>
                <option value="name:asc">Name A–Z</option>
                <option value="name:desc">Name Z–A</option>
                <option value="email:asc">Email A–Z</option>
                <option value="email:desc">Email Z–A</option>
                <option value="company:asc">Company A–Z</option>
                <option value="company:desc">Company Z–A</option>
              </select>
            </div>
          </div>

          {/* Bulk-select action bar */}
          {selectedCount > 0 && (
            <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-emerald-200/20 bg-emerald-400/10 p-3 sm:flex-row sm:items-center">
              <p className="text-sm font-medium text-emerald-100">
                {selectedCount} contact{selectedCount === 1 ? "" : "s"} selected
              </p>

              <button
                type="button"
                onClick={exportSelectedEmails}
                className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Export selected as CSV
              </button>
            </div>
          )}
        </div>

        {/* ── Data table ── */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] divide-y divide-gray-100 text-left">
            <thead className="bg-gray-50">
              <tr>
                {/* Select-all checkbox */}
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    aria-label="Select all subscribed contacts on this page"
                    checked={allSubscribedSelected}
                    onChange={toggleSelectAll}
                    disabled={subscribedContacts.length === 0}
                    className="h-4 w-4 rounded border-emerald-200/40 text-emerald-400 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Contact
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Company
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Folder
                </th>

                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {/* Loading state */}
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-sm text-gray-500"
                  >
                    Loading contacts…
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                /* Empty state */
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <p className="text-3xl" aria-hidden="true">
                      👥
                    </p>

                    <p className="mt-3 font-semibold text-gray-900">
                      No contacts found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {search || statusFilter
                        ? "Try changing your search or filters."
                        : selectedList
                          ? "This folder is empty. Add a contact to get started."
                          : "Add your first contact to get started."}
                    </p>

                    {!search && !statusFilter && (
                      <button
                        type="button"
                        onClick={openAddContact}
                        className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                      >
                        + Add contact
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                /* Contact rows */
                contacts.map((contact) => {
                  const contactListId = getListId(contact);

                  const listName =
                    typeof contact.listId === "object"
                      ? contact.listId?.name
                      : lists.find((list) => list._id === contactListId)?.name;

                  return (
                    <tr
                      key={contact._id}
                      className="transition-colors hover:bg-white/[0.10]"
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Select ${contact.email}`}
                          disabled={contact.status !== "Subscribed"}
                          checked={selectedContacts.includes(contact._id)}
                          onChange={() => toggleContactSelection(contact._id)}
                          className="h-4 w-4 rounded border-emerald-200/40 text-emerald-400 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </td>

                      {/* Contact name + email */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            aria-hidden="true"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200/20 bg-emerald-400/15 text-sm font-bold text-emerald-100"
                          >
                            {getContactName(contact).charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {getContactName(contact)}
                            </p>
                            <p className="mt-1 max-w-[220px] truncate text-xs text-gray-500">
                              {contact.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <span>{contact.company || "—"}</span>
                        {Object.entries(contact.customFields || {}).length > 0 && (
                          <span className="mt-1 block max-w-56 truncate text-xs text-gray-400" title={Object.entries(contact.customFields).map(([name, value]) => `${name}: ${value}`).join(", ")}>
                            {Object.entries(contact.customFields).slice(0, 2).map(([name, value]) => `${name}: ${value}`).join(" · ")}
                          </span>
                        )}
                      </td>

                      {/* Folder */}
                      <td className="px-4 py-4">
                        {listName ? (
                          <button
                            type="button"
                            onClick={() => {
                              const list = lists.find(
                                (item) => item._id === contactListId,
                              );
                              if (list) openFolder(list);
                            }}
                            className="max-w-[150px] truncate rounded-full border border-emerald-200/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-50 hover:bg-emerald-400/20 hover:text-white"
                            title={`Open ${listName}`}
                          >
                            📁 {listName}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No folder
                          </span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClass(
                            contact.status,
                          )}`}
                        >
                          {contact.status || "Unknown"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditContact(contact)}
                            className="rounded-lg border border-emerald-200/30 bg-emerald-400/5 px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:border-emerald-200/50 hover:bg-emerald-400/15 hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteContact(contact)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-red-600 hover:border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && pagination.pages > 1 && (
          <div className="flex flex-col justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-emerald-200/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-emerald-200/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
