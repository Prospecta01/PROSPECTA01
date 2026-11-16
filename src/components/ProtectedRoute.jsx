import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <span className="h-10 w-10 rounded-full border-4 border-zinc-200 border-t-prospecta-700 animate-spin" />
          <span className="text-sm font-medium">Cargando PROSPECTA RTM…</span>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.rol)) {
    const path = user.rol === 'Supervisor' ? '/supervisor' : user.rol === 'Coordinador Regional' ? '/coordinador' : user.rol === 'Administrador' ? '/admin' : user.rol === 'Validador' ? '/validador' : '/prospector'
    return <Navigate to={path} replace />
  }
  return children
}
