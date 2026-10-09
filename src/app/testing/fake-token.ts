/** JWT sin firmar válido solo para leer "exp" en el navegador. */
export function fakeToken(expSeconds: number): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'HS256' })}.${b64({ exp: expSeconds })}.firma`;
}
