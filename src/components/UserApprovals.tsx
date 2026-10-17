import React, { useCallback, useEffect, useState } from 'react';
import { Users, RefreshCw, Check, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { listUsuarios, setUsuarioRol } from '../services/backendClient';
import { Usuario } from '../types';

type Rol = Usuario['rol'];

const ROLES: { value: Exclude<Rol, 'PENDIENTE'>; label: string; modulos: string }[] = [
  { value: 'ADMIN', label: 'Administrador general', modulos: 'Todos los módulos' },
  { value: 'CFO', label: 'Director Ejecutivo', modulos: 'Panel, Finanzas, Documentos' },
  { value: 'RRHH', label: 'Gestión Talento Humano', modulos: 'Panel, RR.HH., Producción, Documentos' },
  { value: 'COO', label: 'Director de Operaciones', modulos: 'Panel, Producción, Documentos' },
];

interface UserApprovalsProps {
  currentUser: Usuario;
  appendLog: (agente: any, detail: string, nivel: any) => void;
}

/** Pantalla para que un ADMIN apruebe cuentas nuevas y gestione roles. */
export default function UserApprovals({ currentUser, appendLog }: UserApprovalsProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Record<string, Rol>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsuarios(await listUsuarios());
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la lista.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isSelf = (u: Usuario) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase();

  const apply = async (u: Usuario, rol: Rol) => {
    setBusyId(u.id);
    try {
      await setUsuarioRol(u.id, rol);
      toast.success(rol === 'PENDIENTE' ? `Acceso revocado a ${u.nombre}.` : `${u.nombre} ahora es ${rol}.`);
      appendLog('Agente de Auditoría', `${currentUser.nombre} cambió el rol de ${u.email}: ${u.rol} → ${rol}.`, 'Info');
      await load();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo actualizar el rol.');
    } finally {
      setBusyId(null);
    }
  };

  const pendientes = usuarios.filter((u) => u.rol === 'PENDIENTE');
  const activos = usuarios.filter((u) => u.rol !== 'PENDIENTE');

  const roleSelect = (u: Usuario, fallback: Rol) => (
    <select
      value={selected[u.id] ?? fallback}
      onChange={(e) => setSelected((prev) => ({ ...prev, [u.id]: e.target.value as Rol }))}
      disabled={busyId === u.id}
      className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 outline-none focus:border-brand-primary cursor-pointer"
      aria-label={`Rol de ${u.nombre}`}
    >
      {fallback === 'PENDIENTE' && <option value="PENDIENTE" disabled>Seleccione un rol…</option>}
      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
    </select>
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-primary" />
          <h3 className="font-display font-bold text-slate-800 text-sm">Aprobación de usuarios</h3>
          {pendientes.length > 0 && (
            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold px-2 py-0.5 rounded-full">
              {pendientes.length} pendiente{pendientes.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border-none bg-transparent cursor-pointer"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <section className="space-y-2">
        <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Cuentas por aprobar</h4>
        {!loading && pendientes.length === 0 && <p className="text-xs text-slate-400">No hay cuentas pendientes.</p>}
        {pendientes.map((u) => {
          const rol = selected[u.id];
          const elegido = rol && rol !== 'PENDIENTE';
          return (
            <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-amber-100 bg-amber-50/40 rounded-xl">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{u.nombre}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {roleSelect(u, 'PENDIENTE')}
                <button
                  type="button"
                  disabled={!elegido || busyId === u.id}
                  onClick={() => elegido && apply(u, rol)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg border-none cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Aprobar
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="space-y-2">
        <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Usuarios con acceso</h4>
        {activos.map((u) => {
          const self = isSelf(u);
          const rol = (selected[u.id] ?? u.rol) as Rol;
          return (
            <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-slate-200 rounded-xl">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {u.nombre}{self && <span className="ml-2 text-[10px] text-slate-400 font-mono">(usted)</span>}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {u.email} · {ROLES.find((r) => r.value === u.rol)?.modulos}
                </p>
              </div>
              {self ? (
                <span className="text-[10px] text-slate-400 font-mono">No puede cambiar su propio rol</span>
              ) : (
                <div className="flex items-center gap-2">
                  {roleSelect(u, u.rol)}
                  <button
                    type="button"
                    disabled={rol === u.rol || busyId === u.id}
                    onClick={() => apply(u, rol)}
                    className="px-3 py-1.5 bg-brand-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg border-none cursor-pointer"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === u.id}
                    onClick={() => window.confirm(`¿Revocar el acceso de ${u.nombre}?`) && apply(u, 'PENDIENTE')}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer"
                    title="Revocar acceso"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
