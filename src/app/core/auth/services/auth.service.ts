import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface SendOtpPayload {
  email: string;
  password: string;
}

export interface SendOtpResponse {
  message: string;
  challengeId: string;
  expiresAt: string;
  maskedEmail: string;
  devOtpCode?: string;
}

interface RegisterPayload {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
}

interface VerifyOtpPayload {
  challengeId: string;
  otpCode: string;
}

interface ResendOtpPayload {
  challengeId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface VerifyOtpResponse {
  message: string;
  session: AuthSession;
  user: AuthUser;
}

export interface ResendOtpResponse {
  message: string;
  challengeId: string;
  expiresAt: string;
  maskedEmail: string;
  devOtpCode?: string;
}

const AUTH_SESSION_STORAGE_KEY = 'huerto-auth-session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/auth';

  requestOtp(payload: SendOtpPayload): Observable<SendOtpResponse> {
    return this.http.post<SendOtpResponse>(`${this.baseUrl}/send-otp`, payload);
  }

  register(payload: RegisterPayload): Observable<SendOtpResponse> {
    return this.http.post<SendOtpResponse>(`${this.baseUrl}/register`, payload);
  }

  verifyOtp(payload: VerifyOtpPayload): Observable<VerifyOtpResponse> {
    return this.http
      .post<VerifyOtpResponse>(`${this.baseUrl}/verify-otp`, payload)
      .pipe(tap((response) => this.persistSession(response.session)));
  }

  resendOtp(payload: ResendOtpPayload): Observable<ResendOtpResponse> {
    return this.http.post<ResendOtpResponse>(`${this.baseUrl}/resend-otp`, payload);
  }

  getSession(): AuthSession | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed.expiresAt || !parsed.token) {
        this.logout();
        return null;
      }

      if (Date.now() >= Date.parse(parsed.expiresAt)) {
        this.logout();
        return null;
      }

      return parsed;
    } catch {
      this.logout();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  }

  private persistSession(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  }
}
