import Modal from "./Modal.jsx";
import { STATUS_OPTIONS } from "../../../utils/contactUtils.js";

/**
 * Modal form for creating or editing a contact.
 *
 * Props
 * -----
 * @param {boolean}  contactModal          - Whether the modal is open.
 * @param {object|null} editingContact     - Contact being edited (null = create mode).
 * @param {Function} closeContactModal     - Closes the modal.
 * @param {Function} handleContactSubmit   - Form submit handler (receives event).
 * @param {object}   contactForm           - Controlled form values.
 * @param {Function} setContactForm        - State updater for the form values.
 * @param {Array}    lists                 - Available folder/list objects [{_id, name}].
 * @param {boolean}  saving                - True while the API call is in flight.
 */
export default function ContactFormModal({
  contactModal,
  editingContact,
  closeContactModal,
  handleContactSubmit,
  contactForm,
  setContactForm,
  lists,
  saving,
}) {
  if (!contactModal) return null;

  return (
    <Modal
      title={editingContact ? "Edit contact" : "Add new contact"}
      onClose={closeContactModal}
      saving={saving}
    >
      <form onSubmit={handleContactSubmit} className="space-y-4" noValidate>
        {/* Full name */}
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Full name <span className="text-red-500">*</span>
          </label>

          <input
            id="contact-name"
            type="text"
            required
            maxLength={120}
            value={contactForm.name}
            onChange={(event) =>
              setContactForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Enter full name"
            className="w-full rounded-xl border border-emerald-200/30 px-4 py-3 text-sm outline-none focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-300/20"
          />
        </div>

        {/* Email address */}
        <div>
          <label
            htmlFor="contact-email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Email address <span className="text-red-500">*</span>
          </label>

          <input
            id="contact-email"
            type="email"
            required
            maxLength={254}
            value={contactForm.email}
            onChange={(event) =>
              setContactForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="name@example.com"
            className="w-full rounded-xl border border-emerald-200/30 px-4 py-3 text-sm outline-none focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-300/20"
          />
        </div>

        {/* Company */}
        <div>
          <label
            htmlFor="contact-company"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Company
          </label>

          <input
            id="contact-company"
            type="text"
            maxLength={160}
            value={contactForm.company}
            onChange={(event) =>
              setContactForm((current) => ({
                ...current,
                company: event.target.value,
              }))
            }
            placeholder="Company name (optional)"
            className="w-full rounded-xl border border-emerald-200/30 px-4 py-3 text-sm outline-none focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-300/20"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Custom fields</span>
            <button
              type="button"
              onClick={() => setContactForm((current) => ({
                ...current,
                customFields: { ...(current.customFields || {}), "": "" },
              }))}
              className="text-xs font-semibold text-emerald-300 hover:text-emerald-200"
            >
              + Add field
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(contactForm.customFields || {}).map(([name, value], index) => (
              <div key={`${name}-${index}`} className="flex gap-2">
                <input
                  aria-label={`Custom field ${index + 1} name`}
                  value={name}
                  maxLength={80}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setContactForm((current) => {
                      const entries = Object.entries(current.customFields || {});
                      entries[index] = [nextName, value];
                      return { ...current, customFields: Object.fromEntries(entries) };
                    });
                  }}
                  placeholder="Field name"
                  className="min-w-0 flex-1 rounded-xl border border-emerald-200/30 px-3 py-2 text-sm"
                />
                <input
                  aria-label={`Custom field ${index + 1} value`}
                  value={value}
                  maxLength={1000}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setContactForm((current) => ({
                      ...current,
                      customFields: {
                        ...(current.customFields || {}),
                        [name]: nextValue,
                      },
                    }));
                  }}
                  placeholder="Value"
                  className="min-w-0 flex-1 rounded-xl border border-emerald-200/30 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  aria-label={`Remove custom field ${index + 1}`}
                  onClick={() => setContactForm((current) => {
                    const next = { ...(current.customFields || {}) };
                    delete next[name];
                    return { ...current, customFields: next };
                  })}
                  className="px-2 text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Contact folder */}
        <div>
          <label
            htmlFor="contact-list"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Contact folder
          </label>

          <select
            id="contact-list"
            value={contactForm.listId}
            onChange={(event) =>
              setContactForm((current) => ({
                ...current,
                listId: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-emerald-200/30 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-300/20"
          >
            <option value="">No folder</option>

            {lists.map((list) => (
              <option key={list._id} value={list._id}>
                {list.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subscription status */}
        <div>
          <label
            htmlFor="contact-status-form"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Subscription status
          </label>

          <select
            id="contact-status-form"
            value={contactForm.status}
            onChange={(event) =>
              setContactForm((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-emerald-200/30 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-200/70 focus:ring-2 focus:ring-emerald-300/20"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <p className="mt-1.5 text-xs text-gray-500">
            Only subscribed contacts are eligible for campaigns.
            Unsubscribed contacts are always excluded.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeContactModal}
            disabled={saving}
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
              : editingContact
                ? "Save changes"
                : "Create contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
