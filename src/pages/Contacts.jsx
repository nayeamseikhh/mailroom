import { useCallback, useEffect, useMemo, useState } from "react";

import ContactStats from "./contact/components/ContactStats.jsx";
import FolderSidebar from "./contact/components/FolderSidebar.jsx";
import ContactsTable from "./contact/components/ContactsTable.jsx";
import ContactFormModal from "./contact/components/ContactFormModal.jsx";
import ListFormModal from "./contact/components/ListFormModal.jsx";
import ImportContactsModal from "./contact/components/ImportContactsModal.jsx";

import {
  EMPTY_CONTACT,
  getErrorMessage,
  getListId,
  getContactName,
  getResponseItems,
} from "../utils/contactUtils.js";

import {
  getContacts,
  getContactStats,
  createContact,
  importContacts,
  previewContactImport,
  updateContact,
  deleteContact,
} from "../api/contactApi.js";

import {
  getLists,
  createList,
  updateList,
  deleteList,
} from "../api/listApi.js";

// ─────────────────────────────────────────────────────────────────────────────
// Contacts page — orchestrates all contact and folder state.
// Child components handle rendering only; all API calls and state live here.
// ─────────────────────────────────────────────────────────────────────────────

export default function Contacts() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [contacts, setContacts] = useState([]);
  const [lists, setLists] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    subscribed: 0,
    unsubscribed: 0,
    bounced: 0,
    suppressed: 0,
  });

  // ── Filters / pagination ───────────────────────────────────────────────────
  const [selectedListId, setSelectedListId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("createdAt:desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1,
  });

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // ── Contact modal ─────────────────────────────────────────────────────────
  const [contactModal, setContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);

  // ── List (folder) modal ───────────────────────────────────────────────────
  const [listModal, setListModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [listName, setListName] = useState("");

  // ── Import modal ──────────────────────────────────────────────────────────
  const [importModal, setImportModal] = useState(false);

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedContacts, setSelectedContacts] = useState([]);

  // ── Derived values ────────────────────────────────────────────────────────
  const activeListId = selectedListId;

  const selectedList = useMemo(
    () => lists.find((list) => list._id === selectedListId) || null,
    [lists, selectedListId],
  );

  const selectedCount = selectedContacts.length;
  const folderCount = lists.length;

  // ─────────────────────────────────────────────────────────────────────────
  // Data loaders
  // ─────────────────────────────────────────────────────────────────────────

  const loadLists = useCallback(async () => {
    const response = await getLists({ limit: 100 });
    const items = getResponseItems(response.data, "lists");

    setLists(items);

    // Keep the selected folder only if it still exists after a reload.
    setSelectedListId((currentId) =>
      items.some((item) => item._id === currentId) ? currentId : "",
    );

    return items;
  }, []);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit: 50 };
      const [sortBy, sortOrder] = sort.split(":");
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (activeListId) params.listId = activeListId;

      const response = await getContacts(params);
      const data = response.data;
      const items = getResponseItems(data, "contacts");

      setContacts(items);
      setPagination(
        data?.pagination || {
          page: 1,
          limit: 50,
          total: items.length,
          pages: 1,
        },
      );

      setSelectedContacts([]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, activeListId, sort]);

  const loadStats = useCallback(async () => {
    try {
      const response = await getContactStats();
      setStats((current) => ({ ...current, ...response.data }));
    } catch (err) {
      console.error("Failed to load contact statistics:", err);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadLists().catch((err) => setError(getErrorMessage(err)));
    loadStats();
  }, [loadLists, loadStats]);

  // ── Debounced contacts reload (on filter/page change) ────────────────────
  useEffect(() => {
    const timeout = window.setTimeout(() => loadContacts(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadContacts]);

  // ── Reset to page 1 when filters change ─────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, activeListId, sort]);

  // ─────────────────────────────────────────────────────────────────────────
  // Contact handlers
  // ─────────────────────────────────────────────────────────────────────────

  const openAddContact = () => {
    setEditingContact(null);
    setContactForm({ ...EMPTY_CONTACT, listId: activeListId });
    setError("");
    setNotice("");
    setContactModal(true);
  };

  const openEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name || "",
      email: contact.email || "",
      company: contact.company || "",
      customFields: contact.customFields || {},
      status: contact.status || "Subscribed",
      listId: getListId(contact),
    });
    setError("");
    setNotice("");
    setContactModal(true);
  };

  const closeContactModal = () => {
    if (saving) return;
    setContactModal(false);
    setEditingContact(null);
    setContactForm(EMPTY_CONTACT);
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (!contactForm.name.trim()) {
      setError("Please enter the contact name.");
      return;
    }
    if (!contactForm.email.trim()) {
      setError("Please enter the email address.");
      return;
    }

    const payload = {
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      company: contactForm.company.trim(),
      customFields: Object.fromEntries(
        Object.entries(contactForm.customFields || {})
          .filter(([key, value]) => key.trim() && String(value).trim())
          .map(([key, value]) => [key.trim(), String(value).trim()]),
      ),
      status: contactForm.status,
      listId: contactForm.listId || null,
    };

    setSaving(true);
    setError("");

    try {
      if (editingContact) {
        await updateContact(editingContact._id, payload);
        setNotice("Contact updated successfully.");
      } else {
        await createContact(payload);
        setNotice("Contact created successfully.");
      }

      setContactModal(false);
      setEditingContact(null);
      setContactForm(EMPTY_CONTACT);

      await Promise.all([loadContacts(), loadStats()]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contact) => {
    const confirmed = window.confirm(
      `Delete ${getContactName(contact)} (${contact.email})?`,
    );
    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await deleteContact(contact._id);
      setNotice("Contact deleted successfully.");
      await Promise.all([loadContacts(), loadStats()]);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Folder handlers
  // ─────────────────────────────────────────────────────────────────────────

  const openFolder = (list) => {
    setSelectedListId(list._id);
    setPage(1);
    setSelectedContacts([]);
    setSearch("");
    setStatusFilter("");
    setNotice("");
    setError("");
  };

  const showAllContacts = () => {
    setSelectedListId("");
    setPage(1);
    setSelectedContacts([]);
    setSearch("");
    setStatusFilter("");
    setNotice("");
    setError("");
  };

  const openCreateList = () => {
    setEditingList(null);
    setListName("");
    setError("");
    setNotice("");
    setListModal(true);
  };

  const openEditList = (list) => {
    setEditingList(list);
    setListName(list.name || "");
    setError("");
    setNotice("");
    setListModal(true);
  };

  /** Unified close handler for the folder modal. */
  const closeListModal = () => {
    if (saving) return;
    setListModal(false);
    setEditingList(null);
    setListName("");
  };

  const handleListSubmit = async (event) => {
    event.preventDefault();

    if (!listName.trim()) {
      setError("Please enter a folder name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingList) {
        await updateList(editingList._id, { name: listName.trim() });
        setNotice("Folder renamed successfully.");
      } else {
        await createList({ name: listName.trim() });
        setNotice("Folder created successfully.");
      }

      setListModal(false);
      setEditingList(null);
      setListName("");

      await loadLists();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Import handler
  // ─────────────────────────────────────────────────────────────────────────

  const openImportModal = () => {
    setError("");
    setNotice("");
    setImportModal(true);
  };

  const closeImportModal = () => {
    if (importing) return;
    setImportModal(false);
  };

  const handlePreviewImport = async (files, mapping) => {
    setImporting(true);
    setError("");
    try {
      const { data } = await previewContactImport(files, mapping);
      return data;
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async (files, listId, mapping) => {
    setImporting(true);
    setError("");
    try {
      const { data } = await importContacts(files, listId, mapping);
      setNotice(
        `${data.imported} contact${data.imported === 1 ? "" : "s"} imported; ${data.skipped} row${data.skipped === 1 ? "" : "s"} skipped.`,
      );
      await Promise.all([loadContacts(), loadStats(), loadLists()]);
      return data;
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteList = async (list) => {
    const confirmed = window.confirm(
      `Delete the "${list.name}" folder? Contacts inside will become unassigned.`,
    );
    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await deleteList(list._id);

      if (activeListId === list._id) setSelectedListId("");

      setNotice("Folder deleted successfully.");
      await Promise.all([loadLists(), loadContacts(), loadStats()]);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Selection & CSV export
  // ─────────────────────────────────────────────────────────────────────────

  const toggleContactSelection = (contactId) => {
    setSelectedContacts((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = contacts
      .filter((contact) => contact.status === "Subscribed")
      .map((contact) => contact._id);

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedContacts.includes(id));

    setSelectedContacts((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );
  };

  const exportSelectedEmails = () => {
    const selected = contacts.filter(
      (contact) =>
        selectedContacts.includes(contact._id) &&
        contact.status === "Subscribed",
    );

    if (!selected.length) {
      setError("Select at least one subscribed contact.");
      return;
    }

    const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
      ["Name", "Email", "Company", "Status", "List"],
      ...selected.map((contact) => [
        contact.name,
        contact.email,
        contact.company,
        contact.status,
        typeof contact.listId === "object"
          ? contact.listId?.name
          : lists.find((list) => list._id === contact.listId)?.name || "",
      ]),
    ];

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "selected-contacts.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ── Page heading ── */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-1 text-sm font-medium text-emerald-300">
              AUDIENCE MANAGEMENT
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Contacts
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage your contacts, organize email lists, and prepare campaign
              audiences.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCreateList}
              className="rounded-xl border border-emerald-200/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20"
            >
              + New folder
            </button>

            <button
              type="button"
              onClick={openImportModal}
              className="rounded-xl border border-emerald-200/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-400/20"
            >
              ↑ Import CSV
            </button>

            <button
              type="button"
              onClick={openAddContact}
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
            >
              + Add contact
            </button>
          </div>
        </header>

        {/* ── Feedback banners ── */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="shrink-0 text-red-400 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
              className="shrink-0 text-emerald-500 hover:text-emerald-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Stats bar ── */}
        <ContactStats stats={stats} folderCount={folderCount} />

        {/* ── Sidebar + Table ── */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <FolderSidebar
            lists={lists}
            selectedList={selectedList}
            activeListId={activeListId}
            folderCount={folderCount}
            openCreateList={openCreateList}
            showAllContacts={showAllContacts}
            openFolder={openFolder}
            openEditList={openEditList}
            handleDeleteList={handleDeleteList}
          />

          <ContactsTable
            contacts={contacts}
            lists={lists}
            selectedList={selectedList}
            pagination={pagination}
            loading={loading}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sort={sort}
            setSort={setSort}
            selectedCount={selectedCount}
            selectedContacts={selectedContacts}
            toggleSelectAll={toggleSelectAll}
            toggleContactSelection={toggleContactSelection}
            exportSelectedEmails={exportSelectedEmails}
            openAddContact={openAddContact}
            openEditContact={openEditContact}
            handleDeleteContact={handleDeleteContact}
            openFolder={openFolder}
            page={page}
            setPage={setPage}
            onImportClick={openImportModal}
            importing={importing}
          />
        </div>
      </div>

      {/* ── Modals ── */}
      <ContactFormModal
        contactModal={contactModal}
        editingContact={editingContact}
        closeContactModal={closeContactModal}
        handleContactSubmit={handleContactSubmit}
        contactForm={contactForm}
        setContactForm={setContactForm}
        lists={lists}
        saving={saving}
      />

      <ListFormModal
        listModal={listModal}
        editingList={editingList}
        saving={saving}
        onClose={closeListModal}
        handleListSubmit={handleListSubmit}
        listName={listName}
        setListName={setListName}
      />

      <ImportContactsModal
        key={selectedList?._id || "all-lists"}
        importModal={importModal}
        targetList={selectedList}
        lists={lists}
        saving={importing}
        onClose={closeImportModal}
        onPreview={handlePreviewImport}
        onImport={handleImport}
      />
    </main>
  );
}
