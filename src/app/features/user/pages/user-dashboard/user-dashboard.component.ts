import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import {
  UserChatRecommendation,
  UserCropHistoryItem,
  UserDashboardData,
  UserDashboardService,
  UserGrowthStat,
  UserHuerto,
  UserPestAlert
} from '../../services/user-dashboard.service';

interface UserDashboardVm extends UserDashboardData {
  totalHuertos: number;
  alertasCriticas: number;
  promedioSalud: number;
  maxGrowthValue: number;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDashboardComponent {
  private readonly userDashboardService = inject(UserDashboardService);

  readonly vm$ = this.userDashboardService.getDashboardData().pipe(
    map((data): UserDashboardVm => {
      const totalHuertos = data.huertos.length;
      const alertasCriticas = data.alertas.filter((item) => item.severidad === 'Critico').length;
      const totalSalud = data.huertos.reduce((acc, item) => acc + item.salud, 0);
      const promedioSalud = totalHuertos > 0 ? Math.round(totalSalud / totalHuertos) : 0;
      const maxGrowthValue = Math.max(1, ...data.estadisticas.map((item) => item.value));

      return {
        ...data,
        totalHuertos,
        alertasCriticas,
        promedioSalud,
        maxGrowthValue
      };
    })
  );

  trackByHuerto(_index: number, item: UserHuerto): string {
    return item.id;
  }

  trackByAlerta(_index: number, item: UserPestAlert): string {
    return item.id;
  }

  trackByRecommendation(_index: number, item: UserChatRecommendation): string {
    return item.id;
  }

  trackByHistorial(_index: number, item: UserCropHistoryItem): string {
    return item.id;
  }

  trackByStat(_index: number, item: UserGrowthStat): string {
    return item.label;
  }

  toBarHeight(value: number, maxValue: number): number {
    return Math.max(12, Math.round((value / maxValue) * 100));
  }
}
