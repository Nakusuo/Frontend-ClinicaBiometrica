import { Injectable } from '@angular/core';
import * as faceapi from 'face-api.js';

@Injectable({ providedIn: 'root' })
export class BiometricService {
  private modelsLoaded = false;

  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;

    const MODEL_URL = '/assets/models';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    this.modelsLoaded = true;
  }

  async detectFace(video: HTMLVideoElement): Promise<Float32Array | null> {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detections ? detections.descriptor : null;
  }

  async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      videoElement.srcObject = stream;
      return stream;
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      return null;
    }
  }

  stopCamera(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop());
  }
}
