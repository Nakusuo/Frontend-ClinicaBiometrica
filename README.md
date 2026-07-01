# 🏥 Plataforma de Telemedicina Integrada con Autenticación Biométrica

Este proyecto es una solución integral de telemedicina que unifica la gestión de consultas virtuales, expedientes clínicos electrónicos en tiempo real y la validación de identidad mediante **biometría facial**. Desarrollado bajo estándares profesionales para clínicas de atención virtual de alta seguridad.

---

## 🔑 Credenciales y Cuentas Preconfiguradas para Demostraciones

Para facilitar la ejecución de pruebas y demostraciones en tiempo real del sistema, la base de datos local SQLite incluye las siguientes cuentas pre-sembradas:

### 1. 🛠️ Administrador (Acceso tradicional)
* **Correo**: `admin@email.com`
* **Contraseña**: `admin123`
* **Permisos**: Registro y gestión de personal médico, creación de doctores de turno.
* **Nota**: Este rol no requiere validación facial.

### 2. 🥼 Médico de Turno (Acceso Biométrico / Bypass)
* **Nombre**: Dr. Carlos Ruiz
* **Especialidad**: Medicina General
* **Correo**: `carlos@email.com`
* **Contraseña**: `password123`
* **Permisos**: Recepción de consultas inmediatas (videollamadas WebRTC), edición de recetas en llamada y visor de antecedentes.
* **Acceso Biométrico**: Registrado con patrón facial demo. Puedes iniciar sesión usando el botón **Bypass (Sin Cámara)** de la app para simular su autenticación de inmediato.

### 3. 👤 Paciente Demostración (Usuario Viejo con Historial)
* **Nombre**: Maria Delgado
* **Correo**: `maria@email.com`
* **Contraseña**: `password123`
* **DNI**: `12345678`
* **Teléfono**: `+51 987 654 321`
* **Acceso Biométrico**: Registrada con patrón facial demo. Puedes iniciar sesión usando el botón **Bypass (Sin Cámara)** en la sección de login del paciente.
* **Historial Médico Registrado**: Cuenta con antecedentes previos de faringoamigdalitis y recetas activas visibles para el médico en llamada.

---

## ⚡ Guía Rápida de Demostración del Flujo de Trabajo

Para simular una consulta médica virtual de principio a fin, sigue estos sencillos pasos:

1. **Paso 1: Abrir el portal del Médico**
   * Ve a [http://localhost:4200/login](http://localhost:4200/login), selecciona el rol **Médico**, haz clic en **Bypass (Sin Cámara)** para simular el reconocimiento facial y accede como **Dr. Carlos Ruiz**.
   * Asegúrate de marcar tu estado de disponibilidad como **"Disponible"** en el dashboard del médico.

2. **Paso 2: Solicitar Consulta como Paciente**
   * En otra pestaña (o ventana de incógnito), abre [http://localhost:4200/login](http://localhost:4200/login), selecciona el rol **Paciente**, haz clic en **Bypass (Sin Cámara)** y accede como **Maria Delgado**.
   * Haz clic en el botón **"Solicitar Teleconsulta Inmediata"** en la barra superior.
   * Rellena el formulario con su número de teléfono, selecciona *Medicina General* e ingresa los síntomas. Haz clic en **"Iniciar Videollamada"**.

3. **Paso 3: Realizar la Consulta y Guardar Historial**
   * Al enviar el formulario, el paciente entrará en la interfaz de llamada y el **Stepper de Progreso** pasará automáticamente a la fase *"En Consulta"*.
   * En la pantalla del doctor, aparecerá de inmediato una ventana de alerta de **Llamada Entrante**. Haz clic en **Aceptar**.
   * Ambos entrarán a la interfaz de llamada WebRTC.
   * El médico, sin salir de la llamada, podrá presionar el botón **"Escribir Diagnóstico"** para ver los **Antecedentes Clínicos del Paciente** (el historial clínico antiguo de Maria Delgado) y redactar la nueva receta. Al finalizar, el médico guarda la consulta y ambos vuelven a sus paneles de forma fluida.

---

## 🚀 Arquitectura y Tecnologías del Sistema

### Frontend (Este Repositorio)
* **Framework**: Angular 16+
* **Diseño y Estilos**: TailwindCSS y Vanilla CSS (Aesthetics Premium basados en Material Design 3).
* **Biometría Facial**: `face-api.js` (procesamiento local con TensorFlow.js en el cliente).
* **Videollamadas**: WebRTC nativo mediante WebSockets de señalización en tiempo real.

### Backend ([Ver Backend-ClinicaBiometrica](file:///C:/Users/Lenovo/Desktop/Backend-ClinicaBiometrica))
* **Framework**: FastAPI (Python)
* **Base de Datos**: SQLite (para desarrollo ágil sin dependencias complejas locales) y soporte nativo para PostgreSQL en producción.
* **Seguridad**: Criptografía bcrypt para contraseñas tradicionales y tokens JWT para protección de endpoints.

---

## 📁 Estructura del Frontend

```text
src/
├── app/
│   ├── components/
│   │   ├── login/                # Autenticación facial biométrica
│   │   ├── dashboard/            # Panel médico y de personal
│   │   ├── patient-dashboard/    # Panel del paciente con control de citas y teleconsulta
│   │   ├── videocall/            # Interfaz de videollamada WebRTC con panel integrado
│   │   └── expedient/            # Gestión e historial clínico del paciente
│   ├── services/
│   │   ├── auth.service.ts       # Control de sesión
│   │   ├── api.service.ts        # Peticiones HTTP al servidor REST
│   │   └── biometric.service.ts  # Procesamiento de modelos faciales
```

---

## ⚙️ Configuración y Ejecución del Desarrollo

### Instalar dependencias
```bash
npm install
```

### Iniciar el servidor local
```bash
npm start
```
El portal de desarrollo estará disponible en `http://localhost:4200`.