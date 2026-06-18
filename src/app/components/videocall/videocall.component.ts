import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebRTCService } from '../../services/webrtc.service';

@Component({
  selector: 'app-videocall',
  templateUrl: './videocall.component.html',
  styleUrls: ['./videocall.component.css'],
})
export class VideocallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  appointmentId = 0;
  inCall = false;
  callError = '';

  constructor(private route: ActivatedRoute, private router: Router, private webrtcService: WebRTCService) {}

  ngOnInit(): void {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.webrtcService.streamEvent.subscribe(stream => {
      if (this.remoteVideoRef) this.remoteVideoRef.nativeElement.srcObject = stream;
    });
    this.webrtcService.closeEvent.subscribe(() => { this.inCall = false; });
    this.webrtcService.errorEvent.subscribe(err => { this.callError = err.message; });
  }

  async startCall(): Promise<void> {
    try {
      const localStream = await this.webrtcService.startLocalStream();
      this.localVideoRef.nativeElement.srcObject = localStream;
      this.webrtcService.createPeer(true);
      this.inCall = true;
    } catch { this.callError = 'No se pudo iniciar la llamada'; }
  }

  endCall(): void { this.webrtcService.endCall(); this.inCall = false; this.router.navigate(['/dashboard']); }
  ngOnDestroy(): void { this.webrtcService.endCall(); }
}
