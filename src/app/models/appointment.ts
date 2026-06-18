export interface Appointment {
  id: number;
  doctorId: number;
  patientId: number;
  fecha: string;
  hora: string;
  estado: 'programada' | 'en_curso' | 'finalizada' | 'cancelada';
  motivo: string;
}
