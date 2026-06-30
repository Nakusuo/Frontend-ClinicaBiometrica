import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './guards/auth.interceptor';
import { ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
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
import { SetupBiometricsComponent } from './components/setup-biometrics/setup-biometrics.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    PatientFormComponent,
    VideocallComponent,
    ExpedientComponent,
    RoleSelectorComponent,
    DoctorRegisterComponent,
    PatientRegisterComponent,
    PatientDashboardComponent,
    ExpedientEditorComponent,
    SetupBiometricsComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    // Material
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatExpansionModule,
    MatCheckboxModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
