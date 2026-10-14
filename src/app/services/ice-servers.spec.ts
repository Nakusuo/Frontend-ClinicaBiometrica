import { of, throwError } from 'rxjs';
import { ICE_POR_DEFECTO, resolverIceServers } from './ice-servers';

describe('resolverIceServers', () => {
  it('usa los que entrega la API (con TURN)', async () => {
    const turn = [{ urls: ['stun:x'] }, { urls: ['turn:x:3478'], username: '1:doctor-1', credential: 'c' }];
    expect(await resolverIceServers(of({ iceServers: turn }))).toEqual(turn);
  });

  it('si la API falla usa el STUN por defecto', async () => {
    expect(await resolverIceServers(throwError(() => new Error('caída')))).toEqual(ICE_POR_DEFECTO);
  });

  it('si la API no devuelve servidores usa el STUN por defecto', async () => {
    expect(await resolverIceServers(of({ iceServers: [] }))).toEqual(ICE_POR_DEFECTO);
  });
});
