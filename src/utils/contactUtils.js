export const EMPTY_CONTACT = {
  name: "",
  email: "",
  company: "",
  customFields: {},
  status: "Subscribed",
  listId: "",
};

export const STATUS_OPTIONS = ["Subscribed", "Unsubscribed", "Bounced", "Suppressed"];

export function getErrorMessage(error) {
  if (error?.code === "ERR_NETWORK") {
    return "Unable to connect to the API server. Check that the server is running and MongoDB is connected.";
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export function getListId(contact) {
  if (!contact?.listId) return "";

  return typeof contact.listId === "object"
    ? contact.listId._id || ""
    : contact.listId;
}

export function getResponseItems(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];

  return [];
}

export function getContactName(contact) {
  return contact?.name?.trim() || "Unnamed contact";
}

export function getStatusClass(status) {
  switch (status) {
    case "Subscribed":
      return "bg-emerald-400/15 text-emerald-100 ring-emerald-200/20";

    case "Unsubscribed":
      return "bg-amber-400/15 text-amber-100 ring-amber-200/20";

    case "Bounced":
      return "bg-red-400/15 text-red-100 ring-red-200/20";

    case "Suppressed":
      return "bg-red-400/15 text-red-100 ring-red-200/20";

    default:
      return "bg-white/10 text-gray-100 ring-white/15";
  }
}
