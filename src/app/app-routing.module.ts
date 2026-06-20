import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PatientFormComponent } from './components/patient-form/patient-form.component';
import { VideocallComponent } from './components/videocall/videocall.component';
import { ExpedientComponent } from './components/expedient/expedient.component';
import { RoleSelectorComponent } from './components/role-selector/role-selector.component';
import { DoctorRegisterComponent } from './components/doctor-register/doctor-register.component';
import { PatientRegisterComponent } from './components/patient-register/patient-register.component';
import { PatientDashboardComponent } from './components/patient-dashboard/patient-dashboard.component';
import { ExpedientEditorComponent } from './components/expedient-editor/expedient-editor.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/role-selector', pathMatch: 'full' },
  { path: 'role-selector', component: RoleSelectorComponent },
  { path: 'doctor-register', component: DoctorRegisterComponent },
  { path: 'patient-register', component: PatientRegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'patient-dashboard', component: PatientDashboardComponent, canActivate: [AuthGuard] },
  { path: 'patient-form/:id', component: PatientFormComponent, canActivate: [AuthGuard] },
  { path: 'videocall/:id', component: VideocallComponent, canActivate: [AuthGuard] },
  { path: 'expedient/:id', component: ExpedientComponent, canActivate: [AuthGuard] },
  { path: 'expedient-editor/:patientId/:appointmentId', component: ExpedientEditorComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/role-selector' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
