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
      map(({ huertos, alertas }) => {
        const mappedHuertos = huertos.map((h) => this.toUserHuerto(h));
        const mappedAlertas = alertas
          .map((a) => this.toUserAlert(a))
          .sort((a, b) => this.toTime(b.fecha) - this.toTime(a.fecha))
          .slice(0, 6);

        return {
          huertos: mappedHuertos,
          alertas: mappedAlertas,
          recomendaciones: this.generateRecommendations(mappedHuertos, mappedAlertas),
          historial: this.generateHistory(mappedHuertos),
          estadisticas: this.generateStats(mappedHuertos),
        };
      }),
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
      region: h.region_id || h.municipio || 'Region sin asignar',
      estado: mappedEstado,
      cultivosActivos: Math.max(1, Math.round((h.salud ?? 55) / 20)),
      salud: h.salud ?? 100,
    };
  }

  private toUserAlert(a: ApiAlerta): UserPestAlert {
    const severity = a.severidad?.toLowerCase() ?? '';
    let sev: 'Seguro' | 'Advertencia' | 'Critico' = 'Seguro';
    if (severity.includes('alta') || severity.includes('crit')) sev = 'Critico';
    else if (severity.includes('media')) sev = 'Advertencia';

    return {
      id: a.id,
      titulo: a.mensaje ?? 'Alerta',
      severidad: sev,
      fecha: a.created_at ?? '',
    };
  }

  private generateStats(huertos: UserHuerto[]): UserGrowthStat[] {
    if (huertos.length === 0) {
      return [];
    }

    const avg = Math.round(huertos.reduce((acc, item) => acc + item.salud, 0) / huertos.length);
    const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];

    return labels.map((label, index) => {
      const reference = huertos[index % huertos.length];
      const rawValue = Math.round(reference.salud * 0.62 + avg * 0.38 + (index - 2) * 3);

      return {
        label,
        value: this.clamp(rawValue, 20, 100)
      };
    });
  }

  private generateRecommendations(huertos: UserHuerto[], alertas: UserPestAlert[]): UserChatRecommendation[] {
    const result: UserChatRecommendation[] = [];
    const criticAlert = alertas.find((item) => item.severidad === 'Critico');
    const warningHuerto = huertos.find((item) => item.estado !== 'Optimo');
    const bestHuerto = huertos.reduce<UserHuerto | null>((best, current) => {
      if (!best || current.salud > best.salud) {
        return current;
      }
      return best;
    }, null);

    if (criticAlert) {
      result.push({
        id: `rec-alert-${criticAlert.id}`,
        tema: 'Atiende alerta critica',
        recomendacion: `Prioriza la alerta "${criticAlert.titulo}" y confirma inspeccion antes de finalizar el dia.`
      });
    }

    if (warningHuerto) {
      result.push({
        id: `rec-huerto-${warningHuerto.id}`,
        tema: 'Ajuste preventivo de huerto',
        recomendacion: `Realiza revision de humedad y nutrientes en ${warningHuerto.nombre} para recuperar su salud.`
      });
    }

    if (bestHuerto) {
      result.push({
        id: `rec-best-${bestHuerto.id}`,
        tema: 'Replicar buenas practicas',
        recomendacion: `Documenta el manejo aplicado en ${bestHuerto.nombre} y reutilizalo en el resto de huertos.`
      });
    }

    result.push({
      id: 'rec-routine',
      tema: 'Rutina diaria recomendada',
      recomendacion: 'Verifica riego temprano, registra observaciones y cierra el dia con seguimiento de alertas pendientes.'
    });

    return result.slice(0, 4);
  }

  private generateHistory(huertos: UserHuerto[]): UserCropHistoryItem[] {
    const cultivos = ['Tomate saladette', 'Chile jalapeno', 'Pepino', 'Calabaza', 'Lechuga romana'];
    const temporadas = ['Primavera 2026', 'Invierno 2025', 'Otono 2025', 'Verano 2025'];

    return huertos.slice(0, 5).map((huerto, index) => {
      const estado = huerto.salud >= 85
        ? 'Produccion estable'
        : huerto.salud >= 65
          ? 'Seguimiento activo'
          : 'Recuperacion programada';

      return {
        id: `hist-${huerto.id}`,
        cultivo: cultivos[index % cultivos.length],
        huerto: huerto.nombre,
        temporada: temporadas[index % temporadas.length],
        estado,
      };
    });
  }

  private toTime(value: string): number {
    if (!value) {
      return 0;
    }

    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
