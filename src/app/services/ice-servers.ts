import { Observable, firstValueFrom } from 'rxjs';

/** Se usa si la API no responde: basta para llamadas en la misma red. */
export const ICE_POR_DEFECTO: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302'] }];

/** STUN/TURN que entrega la API (credencial TURN temporal); si falla, el STUN por defecto. */
export async function resolverIceServers(peticion: Observable<{ iceServers: RTCIceServer[] }>): Promise<RTCIceServer[]> {
  try {
    const { iceServers } = await firstValueFrom(peticion);
    return iceServers?.length ? iceServers : ICE_POR_DEFECTO;
  } catch {
    return ICE_POR_DEFECTO;
  }
}
