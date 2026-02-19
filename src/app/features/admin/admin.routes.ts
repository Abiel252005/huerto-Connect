import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsuariosComponent } from './pages/admin-usuarios/admin-usuarios.component';
import { AdminHuertosComponent } from './pages/admin-huertos/admin-huertos.component';
import { AdminCultivosComponent } from './pages/admin-cultivos/admin-cultivos.component';
import { AdminRegionesComponent } from './pages/admin-regiones/admin-regiones.component';
import { AdminPlagasComponent } from './pages/admin-plagas/admin-plagas.component';
import { AdminChatbotComponent } from './pages/admin-chatbot/admin-chatbot.component';
import { AdminRecomendacionesComponent } from './pages/admin-recomendaciones/admin-recomendaciones.component';
import { AdminAlertasComponent } from './pages/admin-alertas/admin-alertas.component';
import { AdminEstadisticasComponent } from './pages/admin-estadisticas/admin-estadisticas.component';
import { AdminReportesComponent } from './pages/admin-reportes/admin-reportes.component';
import { AdminIntegracionesComponent } from './pages/admin-integraciones/admin-integraciones.component';
import { AdminConfiguracionComponent } from './pages/admin-configuracion/admin-configuracion.component';
import { AdminAuditoriaComponent } from './pages/admin-auditoria/admin-auditoria.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'usuarios', component: AdminUsuariosComponent },
      { path: 'huertos', component: AdminHuertosComponent },
      { path: 'cultivos', component: AdminCultivosComponent },
      { path: 'regiones', component: AdminRegionesComponent },
      { path: 'plagas', component: AdminPlagasComponent },
      { path: 'chatbot', component: AdminChatbotComponent },
      { path: 'recomendaciones', component: AdminRecomendacionesComponent },
      { path: 'alertas', component: AdminAlertasComponent },
      { path: 'estadisticas', component: AdminEstadisticasComponent },
      { path: 'reportes', component: AdminReportesComponent },
      { path: 'integraciones', component: AdminIntegracionesComponent },
      { path: 'configuracion', component: AdminConfiguracionComponent },
      { path: 'auditoria', component: AdminAuditoriaComponent }
    ]
  }
];
