import { Injectable, EventEmitter } from '@angular/core';
import SimplePeer from 'simple-peer';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebRTCService {
  private peer: SimplePeer.Instance | null = null;
  private localStream: MediaStream | null = null;
  private ws: WebSocket | null = null;

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

  connectSignaling(role: string, userId: number, targetRole: string, targetId: number): void {
    this.disconnectSignaling();
    const wsUrl = `${environment.wsUrl.replace('http', 'ws')}/ws/${role}/${userId}`;
    console.log(`Connecting WebSocket signaling: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log('WS Signal received:', msg);
      if (msg.type === 'signal') {
        this.signal(msg.data);
      } else if (msg.type === 'call-ended') {
        this.closeEvent.emit();
      }
    };

    this.ws.onclose = () => {
      console.log('WS Signaling Connection closed');
    };
  }

  createPeer(initiator: boolean, targetRole: string, targetId: number): void {
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

    this.peer.on('signal', data => {
      this.signalEvent.emit(data);
      this.sendSignal(targetRole, targetId, data);
    });
    this.peer.on('stream', stream => this.streamEvent.emit(stream));
    this.peer.on('close', () => this.closeEvent.emit());
    this.peer.on('error', err => this.errorEvent.emit(err));
  }

  sendSignal(targetRole: string, targetId: number, signalData: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'signal',
        target_role: targetRole,
        target_id: targetId,
        data: signalData
      }));
    }
  }

  signal(data: SimplePeer.SignalData): void {
    this.peer?.signal(data);
  }

  disconnectSignaling(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  endCall(): void {
    this.peer?.destroy();
    this.peer = null;
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.disconnectSignaling();
  }
}
