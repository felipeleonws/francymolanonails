import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Cita, EstadoCita, ProfesionalDB } from './tipos';

const URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export function supabaseListo(): boolean {
  return !!URL && !!ANON;
}

let cliente: SupabaseClient | null = null;

export function sb(): SupabaseClient {
  if (!cliente) {
    if (!supabaseListo()) throw new Error('Falta configurar Supabase (variables PUBLIC_SUPABASE_*)');
    cliente = createClient(URL as string, ANON as string);
  }
  return cliente;
}

interface FilaProfesional {
  id: string;
  nombre: string;
  email: string | null;
  color: string;
  foto: string | null;
  activo: boolean;
  es_admin: boolean;
  horarios: ProfesionalDB['horarios'];
  servicios_ids: string[] | null;
  capacidad_diaria: number | null;
}

interface FilaCita {
  id: string;
  profesional_id: string;
  servicio_id: string;
  variante_id: string;
  variante_nombre: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string | null;
  notas: string | null;
  fecha: string;
  inicio: number;
  duracion: number;
  precio: number;
  estado: EstadoCita;
  creada_en: string;
  es_walkin: boolean;
}

function profDesdeFila(f: FilaProfesional): ProfesionalDB {
  return {
    id: f.id,
    nombre: f.nombre,
    email: f.email,
    foto: f.foto ?? undefined,
    activo: f.activo,
    es_admin: f.es_admin,
    color: f.color,
    horarios: Array.isArray(f.horarios) ? f.horarios : [],
    serviciosIds: f.servicios_ids ?? [],
    capacidadDiaria: f.capacidad_diaria ?? 8,
  };
}

function profHaciaFila(p: ProfesionalDB): Omit<FilaProfesional, 'email'> & { email: string | null } {
  return {
    id: p.id,
    nombre: p.nombre,
    email: p.email,
    color: p.color,
    foto: p.foto ?? null,
    activo: p.activo,
    es_admin: p.es_admin,
    horarios: p.horarios,
    servicios_ids: p.serviciosIds,
    capacidad_diaria: p.capacidadDiaria,
  };
}

function citaDesdeFila(f: FilaCita): Cita {
  return {
    id: f.id,
    profesionalId: f.profesional_id,
    servicioId: f.servicio_id,
    varianteId: f.variante_id,
    varianteNombre: f.variante_nombre,
    clienteNombre: f.cliente_nombre,
    clienteTelefono: f.cliente_telefono,
    clienteEmail: f.cliente_email ?? undefined,
    notas: f.notas ?? undefined,
    fecha: typeof f.fecha === 'string' ? f.fecha.slice(0, 10) : f.fecha,
    inicio: f.inicio,
    duracion: f.duracion,
    precio: f.precio,
    estado: f.estado,
    creadaEn: f.creada_en,
    esWalkIn: f.es_walkin,
  };
}

function citaHaciaFila(c: Cita): FilaCita {
  return {
    id: c.id,
    profesional_id: c.profesionalId,
    servicio_id: c.servicioId,
    variante_id: c.varianteId,
    variante_nombre: c.varianteNombre,
    cliente_nombre: c.clienteNombre,
    cliente_telefono: c.clienteTelefono,
    cliente_email: c.clienteEmail ?? null,
    notas: c.notas ?? null,
    fecha: c.fecha,
    inicio: c.inicio,
    duracion: c.duracion,
    precio: c.precio,
    estado: c.estado,
    creada_en: c.creadaEn,
    es_walkin: !!c.esWalkIn,
  };
}

function lanzarError(res: { error: { message: string } | null }, que: string): void {
  if (res.error) throw new Error(`${que}: ${res.error.message}`);
}

export async function listarProfesionales(): Promise<ProfesionalDB[]> {
  const res = await sb().from('profesionales').select('*').order('created_at', { ascending: true });
  lanzarError(res, 'No se pudo leer el equipo');
  return ((res.data ?? []) as FilaProfesional[]).map(profDesdeFila);
}

export async function guardarProfesional(p: ProfesionalDB): Promise<void> {
  const res = await sb().from('profesionales').upsert(profHaciaFila(p), { onConflict: 'id' });
  lanzarError(res, 'No se pudo guardar la profesional');
}

export async function listarCitas(desde: string, hasta: string): Promise<Cita[]> {
  const res = await sb()
    .from('citas')
    .select('*')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: true })
    .order('inicio', { ascending: true })
    .limit(1000);
  lanzarError(res, 'No se pudieron leer las citas');
  return ((res.data ?? []) as FilaCita[]).map(citaDesdeFila);
}

export async function guardarCita(c: Cita): Promise<void> {
  const res = await sb().from('citas').upsert(citaHaciaFila(c), { onConflict: 'id' });
  lanzarError(res, 'No se pudo guardar la cita');
}

export async function eliminarCita(id: string): Promise<void> {
  const res = await sb().from('citas').delete().eq('id', id);
  lanzarError(res, 'No se pudo eliminar la cita');
}

export async function entrar(email: string, clave: string): Promise<void> {
  const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password: clave });
  if (error) throw new Error('Correo o contraseña incorrectos');
}

export async function salir(): Promise<void> {
  await sb().auth.signOut();
}

export async function correoSesion(): Promise<string | null> {
  const { data } = await sb().auth.getSession();
  return data.session?.user.email ?? null;
}

export async function miPerfil(email: string): Promise<ProfesionalDB | null> {
  const res = await sb().from('profesionales').select('*').eq('email', email).maybeSingle();
  if (res.error) throw new Error(`No se pudo leer tu perfil: ${res.error.message}`);
  const f = res.data as FilaProfesional | null;
  if (!f || !f.activo) return null;
  return profDesdeFila(f);
}
