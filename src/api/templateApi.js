import axiosInstance from './axiosInstance.js'

export const getTemplates = () => axiosInstance.get('/templates')
export const createTemplate = (template) => axiosInstance.post('/templates', template)
export const updateTemplate = (id, template) => axiosInstance.patch(`/templates/${id}`, template)
export const deleteTemplate = (id) => axiosInstance.delete(`/templates/${id}`)
