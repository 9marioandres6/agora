import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard, publicGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
    canActivate: [authGuard]
  },
  {
    path: 'my-profile',
    loadComponent: () => import('./my-profile/my-profile.component').then(c => c.MyProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'new-item',
    loadComponent: () => import('./new-item/new-item.component').then(c => c.NewItemComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(c => c.RegisterComponent),
    canActivate: [publicGuard]
  },
    {
    path: 'no-connection',
    loadComponent: () => import('./no-connection/no-connection.component').then(c => c.NoConnectionComponent)
  },
  {
    path: 'project/:id/private',
    loadComponent: () => import('./private-inner-project/private-inner-project.component').then(c => c.PrivateInnerProjectComponent),
    canActivate: [authGuard]
  },
  {
    path: 'project/:id/public',
    loadComponent: () => import('./public-inner-project/public-inner-project.component').then(c => c.PublicInnerProjectComponent),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
