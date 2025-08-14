import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../AUTH/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, filter, take } from 'rxjs/operators';

export const homeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.authStatus).pipe(
    filter((status) => status !== 'loading'),
    take(1),
    map((status) => {
      if (status === 'authenticated') {
        return true;
      } else {
        router.navigate(['/auth']);
        return false;
      }
    }),
  );
};
