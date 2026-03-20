import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PlagaDeteccion } from '../models/plaga-deteccion.model';
import { Alerta as ApiAlerta } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class PlagasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  getDetecciones(): Observable<PlagaDeteccion[]> {
    return this.http.get<ApiAlerta[]>(`${this.base}/alertas`).pipe(
      map((items) =>
        items
          .filter((a) => a.tipo?.toLowerCase().includes('plaga'))
          .map((a) => this.toDeteccion(a))
      ),
      catchError(() => of([]))
    );
  }

  marcarDeteccion(id: string, estado: PlagaDeteccion['estado']): Observable<boolean> {
    return of(Boolean(id && estado));
  }

  private toDeteccion(a: ApiAlerta): PlagaDeteccion {
    return {
      id: a.id,
      imagenUrl: '',
      plaga: a.mensaje ?? 'Plaga no identificada',
      confianza: 0,
      cultivo: '',
      ubicacion: '',
      fecha: a.created_at ?? '',
      severidad: this.mapSeveridad(a.severidad),
      estado: a.resuelta ? 'Confirmada' : 'Pendiente',
    };
  }

  private mapSeveridad(sev?: string): 'Baja' | 'Media' | 'Alta' {
    if (!sev) return 'Baja';
    const lower = sev.toLowerCase();
    if (lower.includes('alta') || lower.includes('crit')) return 'Alta';
    if (lower.includes('media')) return 'Media';
    return 'Baja';
  }
}
