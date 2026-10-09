export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface HorarioLaboral {
  dia: DiaSemana;
  apertura: number;
  cierre: number;
  pausa?: { inicio: number; fin: number };
}

export interface Profesional {
  id: string;
  nombre: string;
  foto?: string;
  activo: boolean;
  color: string;
  horarios: HorarioLaboral[];
  serviciosIds: string[];
  capacidadDiaria: number;
}

export interface ProfesionalDB extends Profesional {
  email: string | null;
  es_admin: boolean;
}

export type EstadoCita = 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';

export interface Cita {
  id: string;
  profesionalId: string;
  servicioId: string;
  varianteId: string;
  varianteNombre: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  notas?: string;
  fecha: string;
  inicio: number;
  duracion: number;
  precio: number;
  estado: EstadoCita;
  creadaEn: string;
  esWalkIn?: boolean;
}
