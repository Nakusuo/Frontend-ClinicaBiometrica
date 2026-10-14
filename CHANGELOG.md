# Cambios

Formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [versionado semántico](https://semver.org/lang/es/).

## [1.0.0] - 2026-10-14

Primera versión publicada bajo el proceso CMMI nivel 3 ([docs/cmmi del backend](https://github.com/Nakusuo/Backend-ClinicaBiometrica/tree/main/docs/cmmi)).

### Añadido
- Interceptor que envía el token JWT a la API y cierra la sesión cuando vence.
- Ingreso con contraseña como alternativa al rostro; pantalla *Mi rostro*.
- El paciente agenda una cita (#4), y también la cancela o la reprograma (#11).
- Panel del médico: "Citas de Hoy" con la opción "Ver todas" (#5).
- CI con pruebas en Chrome headless y build de producción.

### Corregido
- El frontend no enviaba el token: todas las pantallas daban 401.
- El login toma la contraseña que autocompleta el navegador (#6).
- Se quitaron los datos clínicos inventados de las pantallas.
