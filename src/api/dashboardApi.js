import axiosInstance from './axiosInstance.js'

export const getDashboard = () => axiosInstance.get('/dashboard')
export const getDashboardUsage = () => axiosInstance.get('/dashboard/usage')
