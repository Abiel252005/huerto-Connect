import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import type {
  ReporteItem,
  IntegracionItem,
} from '../mock/reportes.mock';
import { Reporte } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  getReportes(): Observable<ReporteItem[]> {
    return this.http.get<Reporte[]>(`${this.base}/reportes/`).pipe(
      map((items) =>
        items.map((r) => ({
          id: r.id,
          nombre: r.descripcion ?? `Reporte ${r.tipo}`,
          tipo: r.tipo,
          fecha: r.created_at ?? '',
          estado: 'Generado' as const,
        }))
      ),
      catchError(() => of([]))
    );
  }

  getIntegraciones(): Observable<IntegracionItem[]> {
    // Usar el health check del gateway para determinar el estado de los servicios
    return this.http.get<Record<string, unknown>>(`${this.base}/health`).pipe(
      map((health) => {
        const servicios = ['auth-service', 'huertos-service', 'plagas-service', 'chat-service', 'reportes-service'];
        return servicios.map((nombre) => {
          const entry = (health as Record<string, Record<string, string>>)[nombre];
          const status = entry ? entry['status'] ?? 'unknown' : 'unknown';
          return {
            nombre,
            estado: status === 'healthy' ? 'Conectado' as const : 'Degradado' as const,
            ultimaRevision: new Date().toLocaleTimeString(),
          };
        });
      }),
      catchError(() =>
        of([
          { nombre: 'API Gateway', estado: 'Desconectado' as const, ultimaRevision: 'N/A' },
        ])
      )
    );
  }
}
