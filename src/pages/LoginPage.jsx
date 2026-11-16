import { useEffect, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DEMO_MODE } from '../lib/constants'

const routeForRole = (role) => role === 'Administrador' ? '/admin' : role === 'Supervisor' ? '/supervisor' : role === 'Coordinador Regional' ? '/coordinador' : role === 'Validador' ? '/validador' : '/prospector'

export default function LoginPage() {
  const { user, login, demoLoginByRole } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) navigate(routeForRole(user.rol), { replace: true })
  }, [user, navigate])

  useEffect(() => {
    const role = params.get('demo')
    if (!role || !DEMO_MODE) return
    ;(async () => {
      const profile = await demoLoginByRole(role)
      const screen = params.get('screen')
      const target = profile.rol === 'Prospector' && screen ? `/prospector/${screen}` : profile.rol === 'Validador' && screen ? `/validador/${screen}` : routeForRole(profile.rol)
      navigate(target, { replace: true })
    })()
  }, [params, demoLoginByRole, navigate])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const profile = await login(usuario, password)
      navigate(routeForRole(profile.rol), { replace: true })
    } catch (err) {
      setError(err.message || 'No fue posible iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-prospecta-700/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-prospecta-700/15 blur-3xl" />
        <div className="relative w-full max-w-md">
          <div className="mb-7 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            <img src="/logo-prospecta-rtm-oficial.png" alt="PROSPECTA RTM" className="h-28 w-full bg-black object-contain px-5" />
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-prospecta-700">Acceso seguro</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Bienvenido</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Ingresa con el usuario asignado a tu operación de prospección.</p>
            </div>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">DNI / Usuario</span>
                <div className="flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 focus-within:border-prospecta-700 focus-within:ring-4 focus-within:ring-prospecta-700/10">
                  <UserRound size={19} className="text-zinc-400" />
                  <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" className="h-13 w-full bg-transparent px-3 py-3.5 text-base outline-none" placeholder="Ej. 43572700" inputMode="numeric" />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-700">Contraseña</span>
                <div className="flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 focus-within:border-prospecta-700 focus-within:ring-4 focus-within:ring-prospecta-700/10">
                  <LockKeyhole size={19} className="text-zinc-400" />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="h-13 w-full bg-transparent px-3 py-3.5 text-base outline-none" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-zinc-400" aria-label="Mostrar contraseña">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                </div>
              </label>

              {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

              <button disabled={busy} className="w-full rounded-2xl bg-gradient-to-r from-prospecta-700 to-prospecta-800 px-4 py-4 text-sm font-black text-white shadow-soft transition hover:brightness-105 disabled:opacity-60">
                {busy ? 'Validando…' : 'Ingresar a PROSPECTA RTM'}
              </button>
            </form>

            {DEMO_MODE && (
              <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-xs leading-5 text-zinc-600">
                <p className="font-bold text-zinc-800">Modo demo</p>
                <p className="mt-1">Usa el Usuario y la Contraseña definidos en la hoja "Usuario&Contraseña" del Excel proporcionado.</p>
              </div>
            )}
          </div>
          <p className="mt-5 text-center text-xs text-white/45">Uso corporativo · Datos de campo protegidos</p>
        </div>
      </section>
    </div>
  )
}
