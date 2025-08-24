import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ConnectionService } from '../services/connection.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const connectionService = inject(ConnectionService);

  // Check connection status first
  if (!connectionService.isOnline()) {
    router.navigate(['/no-connection']);
    return false;
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const publicGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const connectionService = inject(ConnectionService);

  // Check connection status first
  if (!connectionService.isOnline()) {
    router.navigate(['/no-connection']);
    return false;
  }

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};
