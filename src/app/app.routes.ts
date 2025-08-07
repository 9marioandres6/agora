import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./AUTH/auth.component').then(m => m.AuthComponent),
    loadChildren: () => import('./AUTH/auth.routes').then(m => m.routes)
  },
  {
    path: 'home',
    loadComponent: () => import('./HOME/home.component').then(m => m.HomeComponent),
    canActivate: [() => import('./HOME/home.guard').then(m => m.homeGuard)]
  },
  {
    path: '**',
    redirectTo: 'auth',
    pathMatch: 'full'
  }
];
