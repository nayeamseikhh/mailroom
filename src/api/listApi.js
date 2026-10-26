// import axiosInstance from './axiosInstance.js'

// export const getLists = (params) => axiosInstance.get('/lists', { params })
// export const createList = (list) => axiosInstance.post('/lists', list)
// export const updateList = (id, list) => axiosInstance.patch(`/lists/${id}`, list)
// export const deleteList = (id) => axiosInstance.delete(`/lists/${id}`)

import axiosInstance from "./axiosInstance.js";

export const getLists = (params) => axiosInstance.get("/lists", { params });

export const createList = (list) => axiosInstance.post("/lists", list);

export const updateList = (id, list) =>
  axiosInstance.patch(`/lists/${id}`, list);

export const deleteList = (id) => axiosInstance.delete(`/lists/${id}`);
