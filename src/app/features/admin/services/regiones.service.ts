import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Region } from '../models/region.model';
import { Plantio } from '../models/plantio.model';
import { Region as ApiRegion } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class RegionesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/regiones`;

  getRegiones(): Observable<Region[]> {
    return this.http.get<ApiRegion[]>(this.base).pipe(
      map((items) => items.map((r) => this.toRegion(r))),
      catchError(() => of([]))
    );
  }

  getPlantiosVeracruz(): Observable<Plantio[]> {
    // Obtener plantíos de todas las regiones disponibles
    return this.http.get<ApiRegion[]>(this.base).pipe(
      map((regiones) => {
        // No hay endpoint directo para plantíos generales, así que
        // generamos info mínima basándonos en las regiones
        return regiones.map((r, i) => ({
          id: r.id,
          nombre: r.nombre,
          cultivo: '',
          municipio: r.departamento ?? '',
          lat: 19.1738 + i * 0.02,
          lng: -96.1342 + i * 0.02,
          salud: 85,
          alertas: 0,
          severidad: 'Baja' as const,
        }));
      }),
      catchError(() => of([]))
    );
  }

  private toRegion(r: ApiRegion): Region {
    return {
      id: r.id,
      nombre: r.nombre,
      usuarios: 0,
      huertos: 0,
      detecciones: 0,
      actividad: 'Media',
    };
  }
}
