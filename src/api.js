import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080' })
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = 'Bearer ' + t; return c })
api.interceptors.response.use(r => r, e => {
  if (e.response?.status === 401 && localStorage.getItem('token')) { localStorage.clear(); location.href = '/' } // session expired
  return Promise.reject(e)
})
export default api
