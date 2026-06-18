import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
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

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPatient(patientId);
    this.loadExpedients(patientId);
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
}
