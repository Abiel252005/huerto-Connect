import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() delta = '';
  @Input() icon = 'analytics-outline';
  @Input() tone: 'up' | 'down' | 'steady' = 'steady';
  @Input() spark: number[] = [];
}
