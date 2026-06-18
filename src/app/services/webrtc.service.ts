import { Injectable, EventEmitter } from '@angular/core';
import SimplePeer from 'simple-peer';

@Injectable({ providedIn: 'root' })
export class WebRTCService {
  private peer: SimplePeer.Instance | null = null;
  private localStream: MediaStream | null = null;

  signalEvent = new EventEmitter<SimplePeer.SignalData>();
  streamEvent = new EventEmitter<MediaStream>();
  closeEvent = new EventEmitter<void>();
  errorEvent = new EventEmitter<Error>();

  async startLocalStream(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    return this.localStream;
  }

  createPeer(initiator: boolean): void {
    this.peer = new SimplePeer({
      initiator,
      trickle: false,
      config: {
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
      },
    });

    if (this.localStream) {
      this.peer.addStream(this.localStream);
    }

    this.peer.on('signal', data => this.signalEvent.emit(data));
    this.peer.on('stream', stream => this.streamEvent.emit(stream));
    this.peer.on('close', () => this.closeEvent.emit());
    this.peer.on('error', err => this.errorEvent.emit(err));
  }

  signal(data: SimplePeer.SignalData): void {
    this.peer?.signal(data);
  }

  endCall(): void {
    this.peer?.destroy();
    this.peer = null;
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}
