import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Patient } from '../../models/patient';
import { Expedient } from '../../models/expedient';

@Component({
  selector: 'app-expedient',
  templateUrl: './expedient.component.html',
  styleUrls: ['./expedient.component.css'],
})
export class ExpedientComponent implements OnInit {
  patient: Patient | null = null;
  expedients: Expedient[] = [];
  loading = true;
  role: 'doctor' | 'paciente' | 'admin' | null = null;
  patientId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.role = this.authService.getUserRole();
    this.loadPatient(this.patientId);
    this.loadExpedients(this.patientId);
  }

  getAge(birthDateString?: string): string {
    if (!birthDateString) return 'No especificada';
    try {
      const today = new Date();
      const birthDate = new Date(birthDateString);
      if (isNaN(birthDate.getTime())) return 'No especificada';
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age + ' años';
    } catch {
      return 'No especificada';
    }
  }

  loadPatient(id: number): void {
    this.apiService.getPaciente(id).subscribe({
      next: (patient) => {
        this.patient = patient;
      },
    });
  }

  loadExpedients(patientId: number): void {
    this.apiService.getExpediente(patientId).subscribe({
      next: (expedients) => {
        this.expedients = expedients;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  editExpedient(): void {
    this.router.navigate(['/expedient-editor', this.patientId, 0]);
  }

  goBack(): void {
    if (this.role === 'doctor') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/patient-dashboard']);
    }
  }
}
