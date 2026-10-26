import axiosInstance from './axiosInstance.js'

export const getReports = (params) => axiosInstance.get('/reports', { params })
