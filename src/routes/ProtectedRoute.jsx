import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <p>Loading...</p>
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
