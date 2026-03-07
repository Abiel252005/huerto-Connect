import { Routes } from '@angular/router';
import { HomeComponent } from './features/landing/pages/home/home.component';
import { LoginComponent } from './core/auth/login/login';
import { authGuard } from './core/auth/guards/auth.guard';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    canMatch: [authGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES)
  },
  { path: '**', redirectTo: '' }
];

