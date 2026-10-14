export interface RecentConsultation {
  consultaId: number;
  patientId: number;
  patientName: string;
  diagnostico: string | null;
  fecha: string;
}
