import { useRef, useState } from "react";
import Modal from "./Modal.jsx";

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAPPING_FIELDS = [
  ["name", "Name (required)"],
  ["email", "Email (required)"],
  ["company", "Company"],
  ["phone", "Phone"],
  ["status", "Status"],
  ["notes", "Notes"],
  ["source", "Source"],
];
const ALIASES = {
  name: ["name", "fullname", "contactname"],
  email: ["email", "emailaddress", "e-mail"],
  company: ["company", "companyname"],
  phone: ["phone", "phonenumber"],
  status: ["status", "subscriptionstatus"],
  notes: ["notes"],
  source: ["source"],
};

function suggestedMapping(headers) {
  return Object.fromEntries(MAPPING_FIELDS.flatMap(([field]) => {
    const header = headers.find((item) => ALIASES[field].includes(item.toLowerCase().replace(/[\s_-]/g, "")));
    return header ? [[field, header]] : [];
  }));
}

function downloadRejected(preview) {
  const rows = ["File,Row,Email,Reason"];
  const rejected = Array.isArray(preview)
    ? preview
    : ["invalid", "duplicate", "skipped"].flatMap((category) => preview?.[category] || []);
  for (const item of rejected) {
    rows.push([item.file, item.row, item.email, item.reason]
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(","));
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\uFEFF", rows.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  link.download = "rejected-contacts.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ImportContactsModal({
  importModal,
  targetList,
  lists,
  saving,
  onClose,
  onPreview,
  onImport,
}) {
  const [files, setFiles] = useState([]);
  const [listId, setListId] = useState(targetList?._id || "");
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const [mapping, setMapping] = useState({});
  const [mappingChanged, setMappingChanged] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const inputRef = useRef(null);

  if (!importModal) return null;

  const addFiles = (incoming) => {
    const accepted = [];
    const errors = [];
    for (const file of incoming) {
      if (!/\.(csv|xls|xlsx)$/i.test(file.name)) errors.push(`${file.name}: use CSV, XLS, or XLSX.`);
      else if (file.size > MAX_FILE_SIZE_BYTES) errors.push(`${file.name}: exceeds 5 MB.`);
      else accepted.push(file);
    }
    if (files.length + accepted.length > MAX_FILES) {
      errors.push(`Choose no more than ${MAX_FILES} files per import.`);
    }
    setFiles((current) => [...current, ...accepted].slice(0, MAX_FILES));
    setPreviewResult(null);
    setImportResult(null);
    setMapping({});
    setMappingChanged(false);
    setLocalError(errors.length ? errors.join(" ") : "");
  };

  const reset = () => {
    setFiles([]);
    setListId(targetList?._id || "");
    setLocalError("");
    setMapping({});
    setMappingChanged(false);
    setPreviewResult(null);
    setImportResult(null);
  };

  const handlePreview = async (event) => {
    event.preventDefault();
    setLocalError("");
    if (!files.length || !listId) {
      setLocalError("Choose a contact list and at least one spreadsheet.");
      return;
    }
    try {
      const data = await onPreview(files, mapping);
      setPreviewResult(data);
      setMappingChanged(false);
      if (!Object.keys(mapping).length) setMapping(suggestedMapping(data.headers || []));
    } catch (error) {
      setLocalError(error?.response?.data?.message || "Could not preview the selected file.");
    }
  };

  const handleConfirm = async () => {
    if (!previewResult?.counts?.valid) return;
    if (!window.confirm(`Import ${previewResult.counts.valid} valid contact(s) into the selected list?`)) return;
    setLocalError("");
    try {
      const data = await onImport(files, listId, mapping);
      if (data) setImportResult(data);
    } catch (error) {
      setLocalError(error?.response?.data?.message || "Could not import contacts.");
    }
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  return (
    <Modal title="Import contacts" onClose={close} saving={saving}>
      <div className="space-y-5">
        <label className="block text-sm font-medium text-gray-700">
          Import into list
          <select value={listId} onChange={(event) => setListId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm">
            <option value="">Select a list</option>
            {lists.map((list) => <option key={list._id} value={list._id}>{list.name}</option>)}
          </select>
        </label>

        {!importResult && (
          <>
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop CSV or Excel files here or browse"
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles([...event.dataTransfer.files]); }}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center ${dragging ? "border-emerald-300 bg-emerald-400/15" : "border-emerald-200/30 bg-emerald-400/5"}`}
            >
              <p className="font-medium text-gray-800">{dragging ? "Drop files to add" : "Drop CSV or Excel files here"}</p>
              <p className="mt-1 text-xs text-gray-500">.csv, .xls, .xlsx · up to 10 files, 5 MB each · 10,000 rows total</p>
              <input ref={inputRef} type="file" accept=".csv,.xls,.xlsx" multiple className="hidden" onChange={(event) => { addFiles([...event.target.files]); event.target.value = ""; }} />
            </div>
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex justify-between text-sm">
                <span className="truncate">{file.name}</span>
                <button type="button" onClick={() => { setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index)); setPreviewResult(null); setMapping({}); setMappingChanged(false); }} className="text-red-600">Remove</button>
              </div>
            ))}
          </>
        )}

        {previewResult && !importResult && (
          <>
            <section className="space-y-3">
              <h3 className="font-semibold text-gray-800">Map spreadsheet columns</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {MAPPING_FIELDS.map(([field, label]) => (
                  <label key={field} className="text-sm text-gray-700">
                    {label}
                    <select value={mapping[field] || ""} onChange={(event) => { setMapping((current) => ({ ...current, [field]: event.target.value })); setMappingChanged(true); }} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
                      <option value="">Automatic / not mapped</option>
                      {previewResult.headers.map((header) => <option key={`${field}-${header}`} value={header}>{header}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <button type="button" disabled={saving} onClick={handlePreview} className="rounded-lg border px-3 py-2 text-sm">Refresh preview</button>
              {mappingChanged && <p role="status" className="text-xs text-amber-700">Column mapping changed; refresh the preview before importing.</p>}
            </section>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(previewResult.counts).map(([name, count]) => (
                <div key={name} className="rounded-lg bg-gray-50 p-3 text-center">
                  <strong className="block text-xl">{count}</strong>
                  <span className="capitalize text-xs text-gray-600">{name}</span>
                </div>
              ))}
            </div>
            <PreviewTable rows={previewResult.preview.valid} />
            {["invalid", "duplicate", "skipped"].map((category) => (
              previewResult.counts[category] > 0 && (
                <details key={category} className="rounded-lg border border-gray-200 px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium capitalize text-gray-700">
                    {previewResult.counts[category]} {category} row{previewResult.counts[category] === 1 ? "" : "s"}
                    {previewResult.counts[category] > (previewResult.preview[category]?.length || 0) ? ` (showing first ${previewResult.preview[category]?.length || 0})` : ""}
                  </summary>
                  <ul className="mt-2 max-h-36 space-y-1 overflow-auto text-xs text-gray-600">
                    {previewResult.preview[category].map((item, index) => (
                      <li key={`${item.file}-${item.row}-${index}`}>
                        {item.file}, row {item.row}: {item.email || "no email"} — {item.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )
            ))}
            {(previewResult.counts.invalid + previewResult.counts.duplicate + previewResult.counts.skipped) > 0 && (
              <button type="button" onClick={() => downloadRejected(previewResult.rejectedRows)} className="text-sm font-medium text-emerald-300 underline hover:text-emerald-200">Download rejected rows CSV</button>
            )}
            <button type="button" onClick={handleConfirm} disabled={saving || mappingChanged || !previewResult.counts.valid} className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50">
              {saving ? "Importing…" : `Confirm import of ${previewResult.counts.valid} valid contacts`}
            </button>
          </>
        )}

        {importResult && (
          <section role="status" className="space-y-3">
            <h3 className="font-semibold text-gray-800">Import complete</h3>
            <p className="text-sm text-gray-700">{importResult.imported} contacts imported; {importResult.skipped} rows rejected or skipped.</p>
            {importResult.errors?.length > 0 && (
              <button type="button" onClick={() => downloadRejected({
                invalid: importResult.invalid,
                duplicate: importResult.duplicate,
                skipped: importResult.skippedRows,
              })} className="text-sm font-medium text-emerald-300 underline hover:text-emerald-200">Download rejected rows CSV</button>
            )}
            <button type="button" onClick={close} className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400">Done</button>
          </section>
        )}

        {localError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{localError}</p>}
        {!importResult && !previewResult && (
          <button type="button" onClick={handlePreview} disabled={saving || !files.length || !listId} className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50">
            {saving ? "Analyzing…" : "Preview import"}
          </button>
        )}
      </div>
    </Modal>
  );
}

function PreviewTable({ rows = [] }) {
  if (!rows.length) return <p className="text-sm text-gray-500">No valid rows to preview.</p>;
  const customHeaders = [...new Set(rows.flatMap((row) => Object.keys(row.contact?.customFields || {})))];
  return (
    <div className="max-h-56 overflow-auto rounded-lg border">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-gray-50"><tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Company</th>{customHeaders.map((header) => <th key={header} className="p-2">{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={`${row.file}-${row.row}-${index}`} className="border-t"><td className="p-2">{row.contact?.name}</td><td className="p-2">{row.email}</td><td className="p-2">{row.contact?.company || "—"}</td>{customHeaders.map((header) => <td key={header} className="p-2">{row.contact?.customFields?.[header] || "—"}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
