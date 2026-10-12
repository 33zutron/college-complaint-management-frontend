import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './Auth'
import Student from './Student'
import Admin from './Admin'
import { Toasts } from './ui'

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } }

export default function App() {
  const u = getUser()
  const home = u ? (u.role === 'ADMIN' ? '/admin' : '/student') : '/'
  return (
    <BrowserRouter>
      <Toasts />
      <Routes>
        <Route path="/" element={u ? <Navigate to={home} /> : <Auth />} />
        <Route path="/student" element={u?.role === 'STUDENT' ? <Student user={u} /> : <Navigate to="/" />} />
        <Route path="/admin" element={u?.role === 'ADMIN' ? <Admin user={u} /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
