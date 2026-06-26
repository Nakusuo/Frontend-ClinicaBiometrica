import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Patient } from '../../models/patient';

@Component({
  selector: 'app-patient-form',
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.css'],
})
export class PatientFormComponent implements OnInit {
  patientForm!: FormGroup;
  appointmentId = 0;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.patientForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.minLength(8)]],
      fechaNacimiento: ['', Validators.required],
      telefono: [''],
      email: ['', Validators.email],
      direccion: [''],
    });

    if (this.appointmentId) {
      this.loading = true;
      this.apiService.getCita(this.appointmentId).subscribe({
        next: (cita) => {
          if (cita && cita.patientId) {
            const pId = cita.patientId;
            this.apiService.getPaciente(pId).subscribe({
              next: (patient) => {
                if (patient) {
                  this.patientForm.patchValue({
                    nombre: patient.nombre || '',
                    apellido: patient.apellido || '',
                    dni: patient.dni || '',
                    fechaNacimiento: patient.fechaNacimiento || '',
                    telefono: patient.telefono || '',
                    email: patient.email || '',
                    direccion: patient.direccion || '',
                  });
                }
                this.loading = false;
              },
              error: () => {
                this.loading = false;
              }
            });
          } else {
            this.loading = false;
          }
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.patientForm.invalid) return;
    this.loading = true;
    this.error = '';
    const patient: Patient = this.patientForm.value;
    this.apiService.createPaciente(patient).subscribe({
      next: (created) => this.router.navigate(['/expedient', created.id]),
      error: () => { this.error = 'Error al registrar paciente'; this.loading = false; },
    });
  }
}
