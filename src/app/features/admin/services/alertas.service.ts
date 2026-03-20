import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Alerta } from '../models/alerta.model';
import { Alerta as ApiAlerta } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class AlertasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/alertas`;

  getAlertas(): Observable<Alerta[]> {
    return this.http.get<ApiAlerta[]>(this.base).pipe(
      map((items) => items.map((a) => this.toAlerta(a))),
      catchError(() => of([]))
    );
  }

  actualizarEstado(id: string, estado: Alerta['estado']): Observable<boolean> {
    return of(Boolean(id && estado));
  }

  private toAlerta(a: ApiAlerta): Alerta {
    return {
      id: a.id,
      titulo: a.mensaje ?? '',
      tipo: this.mapTipo(a.tipo),
      severidad: this.mapSeveridad(a.severidad),
      estado: a.resuelta ? 'Resuelta' : 'Abierta',
      region: '',
      fecha: a.created_at ?? '',
      responsable: '',
    };
  }

  private mapTipo(tipo?: string): 'Plaga' | 'Riego' | 'Sensor' | 'Sistema' {
    if (!tipo) return 'Sistema';
    const lower = tipo.toLowerCase();
    if (lower.includes('plaga')) return 'Plaga';
    if (lower.includes('riego')) return 'Riego';
    if (lower.includes('sensor')) return 'Sensor';
    return 'Sistema';
  }

  private mapSeveridad(sev?: string): 'Seguro' | 'Advertencia' | 'Critico' {
    if (!sev) return 'Seguro';
    const lower = sev.toLowerCase();
    if (lower.includes('alta') || lower.includes('crit')) return 'Critico';
    if (lower.includes('media')) return 'Advertencia';
    return 'Seguro';
  }
}
