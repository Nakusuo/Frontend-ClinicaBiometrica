# Frontend - Plataforma de Telemedicina Integrada

Portal web de telemedicina desarrollado con **Angular 16+** y **Angular Material**. Incluye autenticación biométrica facial, gestión de citas y videollamadas WebRTC.

## 📋 Requisitos previos

- **Node.js** 16+ (`node --version`)
- **npm** 7+ (`npm --version`)
- **Git** 2.25+ (`git --version`)
- Terminal Linux/macOS o WSL en Windows
- Cámara web funcional (para biometría facial)

## 🚀 Setup inicial (primera vez)

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/telemedicina.git
cd telemedicina/frontend

# 2. Instalar dependencias
npm install

# 3. Verificar que funciona
npm start
```

El proyecto se abrirá en `http://localhost:4200`

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── login/                # HU01: Login biométrico
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.css
│   │   ├── dashboard/            # HU02: Dashboard doctor
│   │   │   ├── dashboard.component.ts
│   │   │   └── dashboard.component.html
│   │   ├── patient-form/         # HU03: Formulario paciente
│   │   │   ├── patient-form.component.ts
│   │   │   └── patient-form.component.html
│   │   ├── videocall/            # HU04-HU05: Videollamada WebRTC
│   │   │   ├── videocall.component.ts
│   │   │   └── videocall.component.html
│   │   └── expedient/            # HU06: Visualización expediente
│   │       ├── expedient.component.ts
│   │       └── expedient.component.html
│   ├── services/
│   │   ├── auth.service.ts       # Servicio de autenticación
│   │   ├── api.service.ts        # Servicio HTTP hacia backend
│   │   ├── biometric.service.ts  # Servicio de biometría facial
│   │   └── webrtc.service.ts     # Servicio de videollamada
│   ├── models/
│   │   ├── patient.ts
│   │   ├── doctor.ts
│   │   ├── appointment.ts
│   │   └── expedient.ts
│   ├── guards/
│   │   └── auth.guard.ts         # Protección de rutas
│   ├── app.component.ts
│   ├── app-routing.module.ts
│   └── app.module.ts
├── assets/
│   └── images/
├── styles.css                    # Estilos globales
├── main.ts
└── environments/
    ├── environment.ts
    └── environment.prod.ts

angular.json
tsconfig.json
package.json
.gitignore
README.md
```

## 🛠️ Desarrollo

### Crear un componente nuevo
```bash
npx ng generate component components/mi-componente
```

### Crear un servicio nuevo
```bash
npx ng generate service services/mi-servicio
```

### Compilar para desarrollo
```bash
npm start
# O en otra terminal:
ng serve
```

### Compilar para producción
```bash
npm run build
# Genera carpeta dist/ lista para desplegar
```

### Servir frontend compilado (sin `npm start`)
```bash
# Opción 1: Usar http-server
npm install -g http-server
cd dist/telemedicina
http-server -p 4200

# Opción 2: Usar Python
cd dist/telemedicina
python3 -m http.server 4200
```

## 🔌 Conectar con Backend

En `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',  // URL del backend FastAPI
  wsUrl: 'ws://localhost:8000',     // WebSocket para notificaciones
};
```

### Ejemplo de llamada HTTP desde un servicio:

```typescript
// auth.service.ts
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  loginFacial(embedding: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/facial-login`, {
      embedding: embedding
    });
  }

  getPaciente(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/pacientes/${id}`);
  }
}
```

## 🎥 Biometría Facial

### Instalación de librería
```bash
npm install face-api.js
```

### Uso básico en componente

```typescript
import * as faceapi from 'face-api.js';

export class LoginComponent {
  async captureAndGenerateEmbedding() {
    const video = document.getElementById('video') as HTMLVideoElement;
    const detections = await faceapi
      .detectSingleFace(video)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    const embedding = Array.from(detections.descriptor);
    // Enviar embedding al backend
    this.authService.loginFacial(embedding).subscribe(...);
  }
}
```

## 🎬 WebRTC para Videollamadas

### Instalación
```bash
npm install simple-peer
```

### Uso básico

```typescript
import SimplePeer from 'simple-peer';

export class VideocallComponent {
  private peer: SimplePeer.Instance;

  initializePeer(initiator: boolean) {
    this.peer = new SimplePeer({
      initiator: initiator,
      trickIce: false,
      config: {
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] }
        ]
      }
    });

    this.peer.on('signal', data => {
      // Enviar señal de WebRTC al otro usuario
      console.log('Signal:', data);
    });

    this.peer.on('stream', (stream: MediaStream) => {
      // Mostrar stream del otro usuario
      const video = document.getElementById('remote-video') as HTMLVideoElement;
      video.srcObject = stream;
    });
  }

  startLocalStream() {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.peer.addStream(stream);
        const video = document.getElementById('local-video') as HTMLVideoElement;
        video.srcObject = stream;
      });
  }
}
```

## 📦 Angular Material

Componentes recomendados para este proyecto:

```bash
ng add @angular/material
```

Uso en templates:

```html
<!-- Botones -->
<button mat-raised-button color="primary">Click to Call</button>

<!-- Formularios -->
<mat-form-field>
  <input matInput placeholder="Nombre">
</mat-form-field>

<!-- Diálogos -->
<mat-dialog-container>
  <h2>Confirmación</h2>
  <p>¿Aceptar llamada?</p>
</mat-dialog-container>

<!-- Cards -->
<mat-card>
  <mat-card-title>Expediente Médico</mat-card-title>
  <mat-card-content>
    <p>Contenido</p>
  </mat-card-content>
</mat-card>
```

## 🧪 Testing

### Ejecutar tests
```bash
npm test
```

### Ejemplo de test de componente

```typescript
// login.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería capturar rostro', async () => {
    spyOn(component, 'captureAndGenerateEmbedding');
    await component.captureAndGenerateEmbedding();
    expect(component.captureAndGenerateEmbedding).toHaveBeenCalled();
  });
});
```

## 🌐 Despliegue

### Compilar para producción
```bash
npm run build -- --configuration production
```

### Con Docker
```bash
docker build -t telemedicina-frontend .
docker run -p 4200:80 telemedicina-frontend
```

### En servidor Linux
```bash
# Copiar carpeta dist/ a servidor
scp -r dist/telemedicina user@servidor:/var/www/

# En el servidor, servir con Nginx
sudo nano /etc/nginx/sites-available/default
# Configurar para servir desde /var/www/telemedicina
sudo systemctl restart nginx
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'face-api.js'"
```bash
npm install face-api.js
npm install @tensorflow/tfjs @tensorflow/tfjs-core @tensorflow/tfjs-converter
```

### Error: "CORS error al llamar backend"
Asegúrate que el backend (FastAPI) tiene CORS habilitado:
```python
# En backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Error: "ng: command not found"
```bash
npm install -g @angular/cli
```

### Video/audio no funciona
- Verifica permisos de cámara/micrófono en navegador
- Recarga la página (Ctrl+R)
- Abre las DevTools (F12) y busca errores de console

## 📚 Referencias

- [Angular Official Docs](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- [WebRTC MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Simple Peer](https://github.com/feross/simple-peer)

## 📝 Commits recomendados

```bash
# HU01: Login biométrico
git add . && git commit -m "HU01: Implementar login con biometría facial"

# HU02: Dashboard doctor
git commit -m "HU02: Crear dashboard con citas programadas"

# HU03: Formulario paciente
git commit -m "HU03: Formulario de identificación del paciente"

# HU04-05: Videollamada
git commit -m "HU04-05: Implementar click to call y videollamada WebRTC"
```

## 👥 Autor

Equipo Telemedicina - Laboratorio de Integración de Sistemas (UTP)

## 📄 Licencia

Código privado del proyecto académico.