import axiosInstance from './axiosInstance.js'

export const getCampaigns = (params) => axiosInstance.get('/campaigns', { params })
export const getCampaign = (id) => axiosInstance.get(`/campaigns/${id}`)
export const getCampaignPreview = (id) => axiosInstance.get(`/campaigns/${id}/preview`)
export const getCampaignReadiness = () => axiosInstance.get('/campaigns/readiness')
export const createCampaign = (campaign) => axiosInstance.post('/campaigns', campaign)
export const updateCampaign = (id, campaign) => axiosInstance.patch(`/campaigns/${id}`, campaign)
export const deleteCampaign = (id) => axiosInstance.delete(`/campaigns/${id}`)
export const sendCampaign = (id) => axiosInstance.post(`/campaigns/${id}/send`)
export const sendCampaignTest = (id, test) => axiosInstance.post(`/campaigns/${id}/test`, test)
export const getCampaignReport = (id, params) => axiosInstance.get(`/campaigns/${id}/report`, { params })
export const cancelCampaign = (id) => axiosInstance.post(`/campaigns/${id}/cancel`)
