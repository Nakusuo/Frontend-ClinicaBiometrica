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

  async detectFullFace(video: HTMLVideoElement): Promise<any | null> {
    return await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
  }

  private getDistance(p1: faceapi.Point, p2: faceapi.Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  calculateEAR(landmarks: faceapi.FaceLandmarks68): number {
    const pts = landmarks.positions;
    
    // Left eye points: 36 to 41
    const leftEAR = (this.getDistance(pts[37], pts[41]) + this.getDistance(pts[38], pts[40])) / (2 * this.getDistance(pts[36], pts[39]));
    
    // Right eye points: 42 to 47
    const rightEAR = (this.getDistance(pts[43], pts[47]) + this.getDistance(pts[44], pts[46])) / (2 * this.getDistance(pts[42], pts[45]));
    
    // Return average EAR of both eyes
    return (leftEAR + rightEAR) / 2;
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
