import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

const AUTH_SESSION_STORAGE_KEY = 'huerto-auth-session';

function getToken(): string | null {
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Interceptor JWT — inyecta el Bearer token en cada petición.
 * Solo aplica a llamadas que comienzan con '/api'.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = getToken();

  // Inyectar token si existe y la llamada es a la API
  if (token && request.url.includes('/api')) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expirado o inválido — limpiar sesión + estado reactivo y redirigir.
        authService.logoutLocal('session_expired');
      }

      if (error.status === 403) {
        // Sin acceso — redirigir
        router.navigate(['/login'], {
          queryParams: { reason: 'access_denied' },
          replaceUrl: true,
        });
      }

      // Extraer mensaje de error de la API (formato FastAPI: { detail: string })
      const apiMessage =
        error.error?.detail || error.message || 'Error desconocido';
      return throwError(() => ({ ...error, apiMessage }));
    })
  );
};
