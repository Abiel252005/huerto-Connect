import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/services/auth.service';
import { environment } from '../../../../environments/environment';
import {
  Huerto as ApiHuerto,
  Alerta as ApiAlerta,
} from '../../../core/models/api.models';

export interface UserHuerto {
  id: string;
  nombre: string;
  region: string;
  estado: 'Optimo' | 'Atencion' | 'Critico';
  cultivosActivos: number;
  salud: number;
}

export interface UserPestAlert {
  id: string;
  titulo: string;
  severidad: 'Seguro' | 'Advertencia' | 'Critico';
  fecha: string;
}

export interface UserChatRecommendation {
  id: string;
  tema: string;
  recomendacion: string;
}

export interface UserCropHistoryItem {
  id: string;
  cultivo: string;
  huerto: string;
  temporada: string;
  estado: string;
}

export interface UserGrowthStat {
  label: string;
  value: number;
}

export interface UserDashboardData {
  huertos: UserHuerto[];
  alertas: UserPestAlert[];
  recomendaciones: UserChatRecommendation[];
  historial: UserCropHistoryItem[];
  estadisticas: UserGrowthStat[];
}

@Injectable({ providedIn: 'root' })
export class UserDashboardService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base = environment.apiUrl;

  getDashboardData(): Observable<UserDashboardData> {
    return forkJoin({
      huertos: this.http.get<ApiHuerto[]>(`${this.base}/api/huertos`).pipe(catchError(() => of([]))),
      alertas: this.http.get<ApiAlerta[]>(`${this.base}/api/alertas`).pipe(catchError(() => of([]))),
    }).pipe(
      map(({ huertos, alertas }) => ({
        huertos: huertos.map((h) => this.toUserHuerto(h)),
        alertas: alertas.slice(0, 5).map((a) => this.toUserAlert(a)),
        recomendaciones: [],
        historial: [],
        estadisticas: this.generateStats(huertos),
      })),
      catchError(() =>
        of({
          huertos: [],
          alertas: [],
          recomendaciones: [],
          historial: [],
          estadisticas: [],
        })
      )
    );
  }

  getMyHuertos(): Observable<UserHuerto[]> {
    return this.http.get<ApiHuerto[]>(`${this.base}/api/huertos`).pipe(
      map((items) => items.map((h) => this.toUserHuerto(h))),
      catchError(() => of([]))
    );
  }

  private toUserHuerto(h: ApiHuerto): UserHuerto {
    const estado = h.estado?.toLowerCase();
    let mappedEstado: 'Optimo' | 'Atencion' | 'Critico' = 'Optimo';
    if (estado?.includes('crit')) mappedEstado = 'Critico';
    else if (estado?.includes('alert') || estado?.includes('aten')) mappedEstado = 'Atencion';

    return {
      id: h.id,
      nombre: h.nombre,
      region: h.region_id ?? '',
      estado: mappedEstado,
      cultivosActivos: 0,
      salud: h.salud ?? 100,
    };
  }

  private toUserAlert(a: ApiAlerta): UserPestAlert {
    let sev: 'Seguro' | 'Advertencia' | 'Critico' = 'Seguro';
    if (a.severidad?.includes('alta') || a.severidad?.includes('crit')) sev = 'Critico';
    else if (a.severidad?.includes('media')) sev = 'Advertencia';

    return {
      id: a.id,
      titulo: a.mensaje ?? 'Alerta',
      severidad: sev,
      fecha: a.created_at ?? '',
    };
  }

  private generateStats(huertos: ApiHuerto[]): UserGrowthStat[] {
    if (huertos.length === 0) return [];
    return huertos.slice(0, 5).map((h, i) => ({
      label: `Sem ${i + 1}`,
      value: h.salud ?? 50,
    }));
  }
}
