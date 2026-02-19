export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  region: string;
  rol: 'Admin' | 'Productor' | 'Tecnico';
  estado: 'Activo' | 'Inactivo' | 'Suspendido';
  huertos: number;
  ultimaActividad: string;
}
