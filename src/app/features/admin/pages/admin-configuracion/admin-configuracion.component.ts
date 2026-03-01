import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../components/toast-notification/toast-notification.component';

interface ProfileSettings {
  nombre: string;
  rol: string;
  correo: string;
  telefono: string;
  idioma: string;
  zonaHoraria: string;
  resumenDiario: boolean;
  alertasCriticas: boolean;
}

interface MonitoringSettings {
  umbralConfianzaIa: number;
  nivelEscalamiento: 'Media' | 'Alta';
  frecuenciaEscaneoMin: number;
  ventanaRevisionHoras: number;
  canalPrincipal: 'App' | 'Correo' | 'WhatsApp';
  retencionEvidenciaDias: number;
  registrarImagenOriginal: boolean;
  notificacionesPush: boolean;
  monitoreoNocturno: boolean;
  auditoriaEstricta: boolean;
}

interface SecuritySettings {
  dobleFactor: boolean;
  alertaInicioSesion: boolean;
  sesionMaximaMin: number;
  intentosFallidosMax: number;
}

@Component({
  selector: 'app-admin-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-configuracion.component.html',
  styleUrls: ['./admin-configuracion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminConfiguracionComponent {
  private readonly toast = inject(ToastService);

  readonly idiomas = ['Español (MX)', 'English (US)'];
  readonly zonasHorarias = ['America/Mexico_City', 'America/Cancun', 'America/Tijuana'];

  profile: ProfileSettings = {
    nombre: 'Admin Root',
    rol: 'Administrador global',
    correo: 'admin@huerto.mx',
    telefono: '+52 228 150 4821',
    idioma: 'Español (MX)',
    zonaHoraria: 'America/Mexico_City',
    resumenDiario: true,
    alertasCriticas: true
  };

  private readonly monitoringDefaults: MonitoringSettings = {
    umbralConfianzaIa: 82,
    nivelEscalamiento: 'Alta',
    frecuenciaEscaneoMin: 15,
    ventanaRevisionHoras: 24,
    canalPrincipal: 'App',
    retencionEvidenciaDias: 90,
    registrarImagenOriginal: true,
    notificacionesPush: true,
    monitoreoNocturno: false,
    auditoriaEstricta: true
  };

  monitoring: MonitoringSettings = { ...this.monitoringDefaults };

  security: SecuritySettings = {
    dobleFactor: true,
    alertaInicioSesion: true,
    sesionMaximaMin: 45,
    intentosFallidosMax: 5
  };

  saveProfile() {
    this.toast.success('Perfil actualizado correctamente');
  }

  saveMonitoring() {
    this.toast.success('Configuración de monitoreo guardada');
  }

  resetMonitoring() {
    this.monitoring = { ...this.monitoringDefaults };
    this.toast.info('Monitoreo restaurado a valores recomendados');
  }

  saveSecurity() {
    this.toast.success('Políticas de seguridad aplicadas');
  }

  resetSecurity() {
    this.security = {
      dobleFactor: true,
      alertaInicioSesion: true,
      sesionMaximaMin: 45,
      intentosFallidosMax: 5
    };
    this.toast.info('Seguridad restaurada a valores recomendados');
  }

  clampMonitoringRanges() {
    this.monitoring.umbralConfianzaIa = this.clamp(this.monitoring.umbralConfianzaIa, 60, 99);
    this.monitoring.frecuenciaEscaneoMin = this.clamp(this.monitoring.frecuenciaEscaneoMin, 5, 120);
    this.monitoring.ventanaRevisionHoras = this.clamp(this.monitoring.ventanaRevisionHoras, 6, 72);
    this.monitoring.retencionEvidenciaDias = this.clamp(this.monitoring.retencionEvidenciaDias, 7, 365);
  }

  clampSecurityRanges() {
    this.security.sesionMaximaMin = this.clamp(this.security.sesionMaximaMin, 15, 240);
    this.security.intentosFallidosMax = this.clamp(this.security.intentosFallidosMax, 3, 10);
  }

  private clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) { return min; }
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  readonly today = new Date().toISOString().slice(0, 10);
  readonly monitoreoResumen = [
    { label: 'Regiones activas', value: '6' },
    { label: 'Huertos monitoreados', value: '128' },
    { label: 'Alertas últimas 24h', value: '14' },
    { label: 'Modelo IA en producción', value: 'v2.7.3' }
  ];
}
