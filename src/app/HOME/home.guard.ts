import { CanActivateFn } from '@angular/router';

export const homeGuard: CanActivateFn = () => {
  // Aquí deberías agregar la lógica real de protección (ejemplo: verificar autenticación)
  return true;
};
