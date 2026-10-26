const DEFAULT_FALLBACKS = { name: "there" };

export function renderPersonalization(template, contact, fallbacks = {}) {
  const values = { ...DEFAULT_FALLBACKS, ...fallbacks };
  const unresolved = new Set();
  const rendered = String(template || "").replace(
    /{{([^{}]*)}}/g,
    (placeholder, rawField) => {
      const field = rawField.trim();
      if (!/^[A-Za-z][\w.]*$/.test(field)) {
        unresolved.add(field || "invalid placeholder");
        return placeholder;
      }
      const parts = field.split(".");
      let value = "";
      if (field === "companyName" || field === "company") {
        value = contact?.company || contact?.companyName || "";
      } else if (parts[0] === "customFields") {
        value = contact?.customFields?.[parts.slice(1).join(".")] ?? "";
      } else if (["name", "email"].includes(field)) {
        value = contact?.[field] ?? "";
      }
      if (String(value).trim() === "") {
        value = Object.hasOwn(values, field) ? values[field] : "";
      }
      if (String(value).trim() === "") {
        unresolved.add(field);
        return placeholder;
      }
      return String(value).replace(/[\r\n]+/g, " ").trim();
    },
  );
  return { rendered, unresolved: [...unresolved] };
}
