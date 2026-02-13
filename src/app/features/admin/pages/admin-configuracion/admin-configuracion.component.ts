import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-configuracion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-configuracion.component.html',
  styleUrls: ['./admin-configuracion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminConfiguracionComponent {
  settings = [
    { label: 'Umbral de severidad IA', value: '82%' },
    { label: 'Regiones activas', value: '6' },
    { label: 'Notificaciones push globales', value: 'Habilitadas' },
    { label: 'Modo auditoria estricta', value: 'Activo' }
  ];
}
