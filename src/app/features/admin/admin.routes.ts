import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsuariosComponent } from './pages/admin-usuarios/admin-usuarios.component';
import { AdminHuertosComponent } from './pages/admin-huertos/admin-huertos.component';
import { AdminRegionesComponent } from './pages/admin-regiones/admin-regiones.component';
import { AdminPlagasComponent } from './pages/admin-plagas/admin-plagas.component';
import { AdminChatbotComponent } from './pages/admin-chatbot/admin-chatbot.component';
import { AdminEstadisticasComponent } from './pages/admin-estadisticas/admin-estadisticas.component';
import { AdminReportesComponent } from './pages/admin-reportes/admin-reportes.component';
import { AdminConfiguracionComponent } from './pages/admin-configuracion/admin-configuracion.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'usuarios', component: AdminUsuariosComponent },
      { path: 'huertos', component: AdminHuertosComponent },
      { path: 'regiones', component: AdminRegionesComponent },
      { path: 'plagas', component: AdminPlagasComponent },
      { path: 'chatbot', component: AdminChatbotComponent },
      { path: 'estadisticas', component: AdminEstadisticasComponent },
      { path: 'reportes', component: AdminReportesComponent },
      { path: 'configuracion', component: AdminConfiguracionComponent }
    ]
  }
];
