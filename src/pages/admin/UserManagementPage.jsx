import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Pencil, Plus, RefreshCw, Search, ShieldCheck, Upload, UserRound, Users, X, Trash2 } from 'lucide-react'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'
import { DEMO_MODE } from '../../lib/constants'
import { deleteUser, listUsers, parseUsersExcel, saveUser, syncUsersFromTemplate, uploadLatestBaseFile } from '../../services/adminUserService'

const EMPTY = {
  usuario: '', password: '', nombre: '', apellido: '', celular: '', region: 'Lima', locacion: '', rol: 'Prospector', status: 'ACTIVO',
}

const roleTone = (role) => role === 'Administrador' ? 'danger' : role === 'Supervisor' || role === 'Coordinador Regional' ? 'info' : role === 'Validador' ? 'success' : 'neutral'

function friendlyError(error) {
  const code = error?.code || ''
  if (code.includes('permission-denied')) return 'No tienes permisos de Administrador para realizar esta acción.'
  if (code.includes('unauthenticated')) return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  return error?.message || 'Ocurrió un error al procesar la solicitud.'
}

export default function UserManagementPage() {
  const fileRef = useRef(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('TODOS')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importFile, setImportFile] = useState('')
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState([0, 0])
  const [importResults, setImportResults] = useState([])
  const [deleteOpen,setDeleteOpen]=useState(false)
  const [deleteTarget,setDeleteTarget]=useState('')
  const [deleteBusy,setDeleteBusy]=useState(false)
  const [deleteError,setDeleteError]=useState('')

  const load = async () => {
    setLoading(true)
    try { setUsers(await listUsers()) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch = !needle || [user.usuario, user.nombre, user.apellido, user.celular, user.region, user.locacion]
        .join(' ').toLowerCase().includes(needle)
      const matchesRole = roleFilter === 'TODOS' || user.rol === roleFilter
      const matchesStatus = statusFilter === 'TODOS' || user.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const counts = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'ACTIVO').length,
    prospectors: users.filter((u) => u.rol === 'Prospector' && u.status === 'ACTIVO').length,
    validators: users.filter((u) => u.rol === 'Validador' && u.status === 'ACTIVO').length,
    admins: users.filter((u) => u.rol === 'Administrador' && u.status === 'ACTIVO').length,
  }), [users])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (user) => {
    setEditing(user.usuario)
    setForm({ ...EMPTY, ...user, password: '' })
    setFormError('')
    setFormOpen(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    setFormError('')
    if (!editing && form.password.length < 6) {
      setFormError('Para un usuario nuevo, la contraseña debe tener al menos 6 caracteres.')
      return
    }
    setSaving(true)
    try {
      await saveUser({...form,locacion:['Supervisor','Coordinador Regional'].includes(form.rol)?'':form.locacion})
      setFormOpen(false)
      await load()
    } catch (error) {
      setFormError(friendlyError(error))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if(!deleteTarget)return
    setDeleteBusy(true);setDeleteError('')
    try { await deleteUser(deleteTarget); setDeleteOpen(false); setDeleteTarget(''); await load() }
    catch(error){ setDeleteError(friendlyError(error)) } finally { setDeleteBusy(false) }
  }

  const chooseExcel = async (file) => {
    if (!file) return
    setImportError('')
    setImportResults([])
    setImportRows([])
    setImportFile(file.name)
    try {
      const rows = await parseUsersExcel(file)
      setImportRows(rows)
    } catch (error) {
      setImportError(error.message || 'No fue posible leer el Excel.')
    }
  }

  const runImport = async () => {
    if (!importRows.length) return
    setImporting(true)
    setImportError('')
    setImportResults([])
    setProgress([0, importRows.length])
    try {
      const results = await syncUsersFromTemplate(importRows, (done, total) => setProgress([done, total]))
      if(results.every(r=>r.ok)) await uploadLatestBaseFile('USUARIOS', fileRef.current?.files?.[0])
      setImportResults(results)
      await load()
    } catch (error) {
      setImportError(friendlyError(error))
    } finally {
      setImporting(false)
    }
  }

  const resetImport = () => {
    setImportRows([])
    setImportFile('')
    setImportError('')
    setImportResults([])
    setProgress([0, 0])
    if (fileRef.current) fileRef.current.value = ''
  }

  const importSummary = useMemo(() => ({
    ok: importResults.filter((r) => r.ok).length,
    created: importResults.filter((r) => r.ok && r.action === 'CREADO').length,
    updated: importResults.filter((r) => r.ok && r.action === 'ACTUALIZADO').length,
    failed: importResults.filter((r) => !r.ok).length,
  }), [importResults])

  return (
    <AppShell title="Gestión de Usuarios" subtitle="Altas, modificaciones, activación y carga masiva desde Excel.">
      {DEMO_MODE && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">Modo demo: los cambios de esta pantalla son locales y no modifican Supabase.</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Usuarios" value={counts.total} icon={Users} />
        <Metric label="Activos" value={counts.active} icon={CheckCircle2} />
        <Metric label="Prospectores" value={counts.prospectors} icon={UserRound} />
        <Metric label="Validadores" value={counts.validators} icon={UserRound} />
        <Metric label="Administradores" value={counts.admins} icon={ShieldCheck} />
      </div>

      <div className="mt-5 rounded-[2rem] bg-white p-4 shadow-card ring-1 ring-black/5 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black">Base de usuarios</p>
            <p className="mt-1 text-xs text-zinc-500">Supabase Auth controla el acceso; PostgreSQL conserva los datos operativos del perfil.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-prospecta-700 px-4 py-3 text-xs font-black text-white shadow-soft"><Plus size={17}/> Nuevo usuario</button>
            <button onClick={()=>{setDeleteTarget('');setDeleteError('');setDeleteOpen(true)}} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700"><Trash2 size={17}/> Eliminar usuario</button>
            <button onClick={() => { resetImport(); setImportOpen(true) }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-xs font-black text-white"><FileSpreadsheet size={17}/> Importar Excel</button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_180px_160px_auto]">
          <label className="flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3">
            <Search size={17} className="text-zinc-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent px-2 py-3 text-sm outline-none" placeholder="Buscar por usuario, nombre, celular, región..." />
          </label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="field py-3"><option value="TODOS">Todos los roles</option><option>Prospector</option><option>Validador</option><option>Supervisor</option><option>Coordinador Regional</option><option>Administrador</option></select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field py-3"><option value="TODOS">Todos</option><option>ACTIVO</option><option>INACTIVO</option></select>
          <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-xs font-bold text-zinc-600 hover:bg-zinc-50"><RefreshCw size={16}/> Actualizar</button>
        </div>

        {loading ? <div className="py-14 text-center text-sm text-zinc-500">Cargando usuarios…</div> : (
          <>
            <div className="mt-4 space-y-2 md:hidden">
              {visible.map((user) => <UserCard key={user.usuario} user={user} onEdit={() => openEdit(user)} />)}
            </div>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px] text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-zinc-400"><tr><th className="px-3 py-3">Usuario</th><th className="px-3 py-3">Nombre</th><th className="px-3 py-3">Celular</th><th className="px-3 py-3">Región / Locación</th><th className="px-3 py-3">Rol</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3 text-right">Acción</th></tr></thead>
                <tbody className="divide-y divide-zinc-100">{visible.map((user) => <tr key={user.usuario} className="hover:bg-zinc-50"><td className="px-3 py-3 font-black">{user.usuario}</td><td className="px-3 py-3"><p className="font-bold">{user.nombre} {user.apellido}</p></td><td className="px-3 py-3">{user.celular || '—'}</td><td className="px-3 py-3"><p className="font-semibold">{user.region}</p><p className="text-zinc-400">{user.locacion}</p></td><td className="px-3 py-3"><StatusBadge tone={roleTone(user.rol)}>{user.rol}</StatusBadge></td><td className="px-3 py-3"><StatusBadge tone={user.status === 'ACTIVO' ? 'success' : 'neutral'}>{user.status}</StatusBadge></td><td className="px-3 py-3 text-right"><button onClick={() => openEdit(user)} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 font-bold text-prospecta-700 hover:bg-prospecta-50"><Pencil size={14}/> Editar</button></td></tr>)}</tbody>
              </table>
            </div>
            {!visible.length && <div className="py-12 text-center text-sm text-zinc-500">No hay usuarios con esos filtros.</div>}
          </>
        )}
      </div>

      {formOpen && <Modal onClose={() => !saving && setFormOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Usuario *"><input className="field" required value={form.usuario} disabled={Boolean(editing)} onChange={(e) => setForm({ ...form, usuario: e.target.value.trim() })} placeholder="Ej. 72188981" /></Field>
            <Field label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña *'}><input className="field" type="password" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? 'Vacío = mantener actual' : 'Mínimo 6 caracteres'} /></Field>
            <Field label="Nombres *"><input className="field" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
            <Field label="Apellido *"><input className="field" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} /></Field>
            <Field label="Celular *"><input inputMode="tel" className="field" required value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value.replace(/[^0-9+]/g, '') })} placeholder="Ej. 999999999" /></Field>
            <Field label="Region *"><select className="field" required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}><option>Lima</option><option>Norte</option><option>Sur</option><option>Centro Oriente</option><option>Nacional</option></select></Field>
            {!['Supervisor','Coordinador Regional'].includes(form.rol) && <Field label="Locación *"><input className="field" required value={form.locacion} onChange={(e) => setForm({ ...form, locacion: e.target.value })} placeholder="Ej. Arequipa" /></Field>}
            <Field label="Rol *"><select className="field" required value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value, locacion: ['Supervisor','Coordinador Regional'].includes(e.target.value) ? '' : form.locacion })}><option>Prospector</option><option>Validador</option><option>Supervisor</option><option>Coordinador Regional</option><option>Administrador</option></select></Field>
            <Field label="Status *"><select className="field" required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>ACTIVO</option><option>INACTIVO</option></select></Field>
          </div>
          <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-600">La estructura corresponde a la hoja <b>Usuario&amp;Contraseña</b>: Usuario, Contraseña, Nombre, Apellido, Celular, Región, Locación, Rol y Status. Para Supervisor y Coordinador Regional no se solicita Locación: ambos se asignan por Región. El Supervisor sí mantiene el filtro Locación dentro de su dashboard para segmentar las locaciones de su Región. Las locaciones con usuarios ACTIVO alimentan los filtros de Avance; <b>La Molina no se muestra</b> en dichos filtros.{editing ? ' Deja la contraseña vacía para conservar la actual.' : ''}</div>
          {formError && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</div>}
          <div className="grid grid-cols-2 gap-2 pt-2"><button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-bold">Cancelar</button><button disabled={saving} className="rounded-2xl bg-prospecta-700 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{saving ? 'Guardando…' : 'Guardar usuario'}</button></div>
        </form>
      </Modal>}

      {deleteOpen && <Modal onClose={()=>!deleteBusy&&setDeleteOpen(false)} title="Eliminar usuario">
        <div className="space-y-4">
          <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">Se eliminará el acceso de Supabase Auth. Si el usuario tiene historial operativo, su perfil quedará archivado como INACTIVO para conservar jornadas y visitas.</div>
          <Field label="Usuario a eliminar"><select className="field" value={deleteTarget} onChange={e=>setDeleteTarget(e.target.value)}><option value="">Selecciona un usuario</option>{users.filter(u=>u.status==='ACTIVO').map(u=><option key={u.usuario} value={u.usuario}>{u.nombre} {u.apellido} · {u.usuario} · {u.rol}</option>)}</select></Field>
          {deleteError&&<div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{deleteError}</div>}
          <div className="grid grid-cols-2 gap-2"><button onClick={()=>setDeleteOpen(false)} disabled={deleteBusy} className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-bold">Cancelar</button><button onClick={confirmDelete} disabled={!deleteTarget||deleteBusy} className="rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white disabled:opacity-40">{deleteBusy?'Eliminando…':'Confirmar eliminación'}</button></div>
        </div>
      </Modal>}

      {importOpen && <Modal onClose={() => !importing && setImportOpen(false)} title="Importar usuarios desde Excel" wide>
        <div className="space-y-4">
          <div className="rounded-2xl border border-prospecta-100 bg-prospecta-50 p-4 text-xs leading-5 text-zinc-700">
            Usa la hoja <b>Usuario&Contraseña</b> con las columnas: Usuario, Contraseña, Nombre, Apellido, Celular, Región, Locación, Rol y Status. La nueva carga reemplaza la visual vigente: quien ya no aparezca en el archivo dejará de mostrarse, pero conservará su historial operativo. La contraseña nunca se guarda en PostgreSQL.
          </div>

          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => chooseExcel(e.target.files?.[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={importing} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-sm font-black text-zinc-700 hover:border-prospecta-300 hover:bg-prospecta-50"><Upload size={20}/>{importFile || 'Seleccionar archivo Excel'}</button>

          {importRows.length > 0 && !importResults.length && <div>
            <div className="flex items-center justify-between"><p className="text-sm font-black">Vista previa</p><StatusBadge tone="info">{importRows.length} usuarios</StatusBadge></div>
            <div className="mt-2 max-h-48 overflow-auto rounded-2xl border border-zinc-200">
              <table className="w-full text-left text-xs"><thead className="sticky top-0 bg-zinc-50 text-zinc-500"><tr><th className="px-3 py-2">Usuario</th><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">Celular</th><th className="px-3 py-2">Rol</th><th className="px-3 py-2">Estado</th></tr></thead><tbody className="divide-y divide-zinc-100">{importRows.slice(0, 100).map((row) => <tr key={row.usuario}><td className="px-3 py-2 font-bold">{row.usuario}</td><td className="px-3 py-2">{row.nombre} {row.apellido}</td><td className="px-3 py-2">{row.celular}</td><td className="px-3 py-2">{row.rol}</td><td className="px-3 py-2">{row.status}</td></tr>)}</tbody></table>
            </div>
            {importRows.length > 100 && <p className="mt-2 text-[11px] text-zinc-400">Se muestran los primeros 100 registros.</p>}
          </div>}

          {importing && <div className="rounded-2xl bg-zinc-50 p-4"><div className="flex justify-between text-xs font-bold"><span>Procesando usuarios…</span><span>{progress[0]}/{progress[1]}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-prospecta-700 transition-all" style={{ width: `${progress[1] ? (progress[0] / progress[1]) * 100 : 0}%` }} /></div></div>}

          {importResults.length > 0 && <div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Mini label="Procesados" value={importSummary.ok} /><Mini label="Creados" value={importSummary.created} /><Mini label="Actualizados" value={importSummary.updated} /><Mini label="Errores" value={importSummary.failed} danger={importSummary.failed > 0} /></div>
            {importSummary.failed > 0 && <div className="mt-3 max-h-40 overflow-auto rounded-2xl bg-red-50 p-3 text-xs text-red-800">{importResults.filter((r) => !r.ok).map((r, index) => <p key={`${r.usuario}-${index}`} className="py-1"><b>{r.usuario}:</b> {r.message}</p>)}</div>}
          </div>}

          {importError && <div className="flex gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertTriangle className="shrink-0" size={18}/><span>{importError}</span></div>}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => setImportOpen(false)} disabled={importing} className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-bold">Cerrar</button>
            {importResults.length ? <button onClick={resetImport} className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-black text-white">Importar otro</button> : <button onClick={runImport} disabled={!importRows.length || importing} className="rounded-2xl bg-prospecta-700 px-4 py-3 text-sm font-black text-white disabled:opacity-40">{importing ? 'Importando…' : 'Confirmar importación'}</button>}
          </div>
        </div>
      </Modal>}
    </AppShell>
  )
}

function Metric({ label, value, icon: Icon }) { const px=String(label||'').length>13?7:String(label||'').length>10?8:10; return <div className="min-w-0 overflow-hidden rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5"><span className="grid h-9 w-9 place-items-center rounded-2xl bg-prospecta-50 text-prospecta-700"><Icon size={17}/></span><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 max-w-full overflow-hidden text-ellipsis font-bold uppercase text-zinc-500" style={{fontSize:`${px}px`,whiteSpace:'nowrap',wordBreak:'normal',overflowWrap:'normal'}}>{label}</p></div> }
function Mini({ label, value, danger }) { return <div className={`rounded-2xl p-3 ${danger ? 'bg-red-50 text-red-700' : 'bg-zinc-50 text-zinc-800'}`}><p className="text-xl font-black">{value}</p><p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</p></div> }
function Field({ label, children }) { return <label className="block"><span className="mb-2 block text-xs font-black text-zinc-700">{label}</span>{children}</label> }
function UserCard({ user, onEdit }) { return <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{user.nombre} {user.apellido}</p><p className="mt-1 text-[11px] text-zinc-500">{user.usuario} · {user.celular || 'Sin celular'} · {user.region}{user.locacion ? ` · ${user.locacion}` : ''}</p></div><button onClick={onEdit} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-prospecta-700 shadow-sm"><Pencil size={16}/></button></div><div className="mt-3 flex gap-2"><StatusBadge tone={roleTone(user.rol)}>{user.rol}</StatusBadge><StatusBadge tone={user.status === 'ACTIVO' ? 'success' : 'neutral'}>{user.status}</StatusBadge></div></div> }
function Modal({ title, children, onClose, wide = false }) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5"><div className={`max-h-[94vh] w-full overflow-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:rounded-[2rem] sm:p-6 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'}`}><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-black">{title}</h2><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-100 text-zinc-600"><X size={19}/></button></div>{children}</div></div> }
