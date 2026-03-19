import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/services/auth.service';

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

interface UserDashboardApiResponse {
  huertos?: UserHuerto[];
  alertas?: UserPestAlert[];
  recomendaciones?: UserChatRecommendation[];
  historial?: UserCropHistoryItem[];
  estadisticas?: UserGrowthStat[];
}

const USER_DASHBOARD_FALLBACK: UserDashboardData = {
  huertos: [
    { id: 'uh-01', nombre: 'Huerto Norte', region: 'Veracruz', estado: 'Optimo', cultivosActivos: 6, salud: 91 },
    { id: 'uh-02', nombre: 'Huerto Familiar', region: 'Xalapa', estado: 'Atencion', cultivosActivos: 4, salud: 72 }
  ],
  alertas: [
    { id: 'ua-01', titulo: 'Riesgo de mildiu en tomate', severidad: 'Advertencia', fecha: 'Hoy 08:30' },
    { id: 'ua-02', titulo: 'Pulgon detectado en pimiento', severidad: 'Critico', fecha: 'Ayer 17:10' }
  ],
  recomendaciones: [
    { id: 'ur-01', tema: 'Riego', recomendacion: 'Reduce un 15% el riego esta semana por alta humedad.' },
    { id: 'ur-02', tema: 'Fertilizacion', recomendacion: 'Prioriza potasio para mejorar floracion en ciclo actual.' },
    { id: 'ur-03', tema: 'Plagas', recomendacion: 'Aplica control biologico preventivo en zonas de sombra.' }
  ],
  historial: [
    { id: 'uc-01', cultivo: 'Tomate saladette', huerto: 'Huerto Norte', temporada: '2025 Otono', estado: 'Cosechado' },
    { id: 'uc-02', cultivo: 'Lechuga romana', huerto: 'Huerto Familiar', temporada: '2026 Invierno', estado: 'Activo' },
    { id: 'uc-03', cultivo: 'Chile serrano', huerto: 'Huerto Norte', temporada: '2026 Primavera', estado: 'En seguimiento' }
  ],
  estadisticas: [
    { label: 'Sem 1', value: 42 },
    { label: 'Sem 2', value: 49 },
    { label: 'Sem 3', value: 56 },
    { label: 'Sem 4', value: 63 },
    { label: 'Sem 5', value: 68 }
  ]
};

@Injectable({ providedIn: 'root' })
export class UserDashboardService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = 'http://localhost:3000/api/user';

  getDashboardData(): Observable<UserDashboardData> {
    return this.http
      .get<UserDashboardApiResponse>(`${this.baseUrl}/dashboard`, { headers: this.buildAuthHeaders() })
      .pipe(
        map((response) => ({
          huertos: response.huertos ?? [],
          alertas: response.alertas ?? [],
          recomendaciones: response.recomendaciones ?? [],
          historial: response.historial ?? [],
          estadisticas: response.estadisticas ?? []
        })),
        catchError(() => of(USER_DASHBOARD_FALLBACK))
      );
  }

  getMyHuertos(): Observable<UserHuerto[]> {
    return this.http
      .get<{ huertos?: UserHuerto[] }>(`${this.baseUrl}/huertos`, { headers: this.buildAuthHeaders() })
      .pipe(
        map((response) => response.huertos ?? []),
        catchError(() => of(USER_DASHBOARD_FALLBACK.huertos))
      );
  }

  private buildAuthHeaders(): HttpHeaders {
    const token = this.authService.getSession()?.token ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
