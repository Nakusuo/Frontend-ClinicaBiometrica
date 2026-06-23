import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient } from '../models/patient';
import { Appointment } from '../models/appointment';
import { Expedient } from '../models/expedient';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Pacientes
  getPaciente(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/pacientes/${id}`);
  }

  createPaciente(patient: Patient): Observable<Patient> {
    return this.http.post<Patient>(`${this.apiUrl}/pacientes`, patient);
  }

  // Citas
  getCitas(doctorId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/citas/doctor/${doctorId}`);
  }

  getCitasPaciente(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/citas/paciente/${patientId}`);
  }

  getCita(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/citas/${id}`);
  }

  updateCitaEstado(id: number, estado: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/citas/${id}/estado`, { estado });
  }

  // Expedientes
  getExpediente(patientId: number): Observable<Expedient[]> {
    return this.http.get<Expedient[]>(`${this.apiUrl}/expedientes/paciente/${patientId}`);
  }

  createExpediente(expedient: Expedient): Observable<Expedient> {
    return this.http.post<Expedient>(`${this.apiUrl}/expedientes`, expedient);
  }

  // Llamadas / Click to Call
  solicitarLlamada(pacienteId: number, citaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/llamadas/solicitar`, { paciente_id: pacienteId, cita_id: citaId });
  }

  aceptarLlamada(citaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/llamadas/${citaId}/aceptar`, {});
  }

  terminarLlamada(citaId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/llamadas/${citaId}/terminar`, {});
  }
}
