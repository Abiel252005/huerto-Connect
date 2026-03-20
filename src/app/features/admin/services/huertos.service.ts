import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Huerto } from '../models/huerto.model';
import { Cultivo } from '../models/cultivo.model';
import { Huerto as ApiHuerto, Cultivo as ApiCultivo } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class HuertosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  getHuertos(): Observable<Huerto[]> {
    return this.http.get<ApiHuerto[]>(`${this.base}/huertos`).pipe(
      map((items) => items.map((h) => this.toHuerto(h))),
      catchError(() => of([]))
    );
  }

  getCultivos(): Observable<Cultivo[]> {
    return this.http.get<ApiCultivo[]>(`${this.base}/cultivos`).pipe(
      map((items) => items.map((c) => this.toCultivo(c))),
      catchError(() => of([]))
    );
  }

  private toHuerto(h: ApiHuerto): Huerto {
    return {
      id: h.id,
      nombre: h.nombre,
      usuario: h.usuario_id ?? '',
      municipio: h.municipio ?? '',
      region: h.region_id ?? '',
      cultivosActivos: 0,
      estado: this.mapEstado(h.estado),
      salud: h.salud ?? 100,
      alertas: 0,
    };
  }

  private toCultivo(c: ApiCultivo): Cultivo {
    return {
      id: c.id,
      nombre: c.nombre,
      temporada: c.temporada ?? '',
      dificultad: 'Media',
      riego: '',
      fertilizacion: '',
      activo: true,
    };
  }

  private mapEstado(estado: string | undefined): 'Optimo' | 'Atencion' | 'Critico' {
    if (!estado) return 'Optimo';
    const lower = estado.toLowerCase();
    if (lower.includes('crit')) return 'Critico';
    if (lower.includes('alert') || lower.includes('aten')) return 'Atencion';
    return 'Optimo';
  }
}
