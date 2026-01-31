import { Routes } from '@angular/router';
import { HomeComponent } from './features/landing/pages/home/home.component';

export class AppRoutes {
    /* ... */
}

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: '**', redirectTo: '' }
];
