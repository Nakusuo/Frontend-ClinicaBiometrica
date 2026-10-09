export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  wsUrl: 'ws://localhost:8000',
  // Muestra el botón "Simular captura" en los registros para probar sin cámara.
  // Nunca activarlo en producción: registra un rostro falso conocido.
  allowBiometricBypass: true,
};
