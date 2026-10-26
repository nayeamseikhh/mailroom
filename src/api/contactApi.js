// import axiosInstance from './axiosInstance.js'

// export const getContacts = (params) => axiosInstance.get('/contacts', { params })
// export const getContactStats = () => axiosInstance.get('/contacts/stats')
// export const createContact = (contact) => axiosInstance.post('/contacts', contact)
// export const updateContact = (id, contact) => axiosInstance.patch(`/contacts/${id}`, contact)
// export const deleteContact = (id) => axiosInstance.delete(`/contacts/${id}`)

import axiosInstance from "./axiosInstance.js";

export const getContacts = (params) =>
  axiosInstance.get("/contacts", { params });

export const getContactStats = () => axiosInstance.get("/contacts/stats");

export const createContact = (contact) =>
  axiosInstance.post("/contacts", contact);

function buildImportForm(files, listId, mapping) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (listId) formData.append("listId", listId);
  if (mapping) formData.append("mapping", JSON.stringify(mapping));
  return formData;
}

export const previewContactImport = (files, mapping) =>
  axiosInstance.post("/contacts/import/preview", buildImportForm(files, "", mapping));

export const importContacts = (files, listId, mapping) =>
  axiosInstance.post("/contacts/import", buildImportForm(files, listId, mapping));

export const updateContact = (id, contact) =>
  axiosInstance.patch(`/contacts/${id}`, contact);

export const deleteContact = (id) => axiosInstance.delete(`/contacts/${id}`);
