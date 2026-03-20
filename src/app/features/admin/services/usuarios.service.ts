import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Usuario, UsuarioFiltro } from '../models/usuario.model';
import { UsuarioAdmin } from '../../../core/models/api.models';

export type { UsuarioFiltro };

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/usuarios`;

  getUsuarios(filtro: UsuarioFiltro = {}): Observable<Usuario[]> {
    let params = new HttpParams();
    if (filtro.rol) params = params.set('rol', filtro.rol);
    if (filtro.estado) params = params.set('estado', filtro.estado);

    return this.http.get<UsuarioAdmin[]>(this.base, { params }).pipe(
      map((items) => {
        let mapped = items.map((u) => this.toUsuario(u));
        if (filtro.busqueda) {
          const q = filtro.busqueda.toLowerCase();
          mapped = mapped.filter(
            (u) => `${u.nombre} ${u.correo}`.toLowerCase().includes(q)
          );
        }
        if (filtro.region) {
          mapped = mapped.filter((u) => u.region === filtro.region);
        }
        return mapped;
      }),
      catchError(() => of([]))
    );
  }

  actualizarEstado(id: string, estado: Usuario['estado']): Observable<boolean> {
    return this.http.patch(`${this.base}/${id}`, { estado }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private toUsuario(u: UsuarioAdmin): Usuario {
    return {
      id: u.id,
      nombre: `${u.nombre} ${u.apellidos}`.trim(),
      correo: u.email,
      region: u.region_id ?? '',
      rol: this.mapRol(u.rol),
      estado: u.estado ?? 'Activo',
      huertos: 0,
      ultimaActividad: u.ultima_actividad ?? '',
    };
  }

  private mapRol(rol: string): 'Admin' | 'Productor' | 'Tecnico' {
    if (rol === 'Admin') return 'Admin';
    if (rol === 'Tecnico') return 'Tecnico';
    return 'Productor';
  }
}
