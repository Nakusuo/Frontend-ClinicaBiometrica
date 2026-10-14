export interface Patient {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
  direccion: string;
  genero?: string | null;
  // Vienen del expediente; null si el médico aún no los registró
  grupoSanguineo?: string | null;
  alergias?: string | null;
  has_biometrics?: boolean;
}
