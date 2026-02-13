import { Routes } from '@angular/router';
import { HomeComponent } from './features/landing/pages/home/home.component';
import { LoginComponent } from './core/auth/login/login';
export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: '**', redirectTo: '' }
];


