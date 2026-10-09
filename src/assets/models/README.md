# Modelos de face-api.js

Pesos oficiales de [face-api.js](https://github.com/justadudewhohacks/face-api.js/tree/master/weights) (v0.22) que usa `BiometricService`:

- `tiny_face_detector_model`: detecta el rostro.
- `face_landmark_68_model`: puntos de referencia de la cara.
- `face_recognition_model`: genera el descriptor de 128 valores que se compara en el backend.

Sin estos archivos la cámara abre pero el registro y el login facial fallan.
