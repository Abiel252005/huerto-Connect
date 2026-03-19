import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';

interface SendOtpPayload {
  email: string;
  password: string;
}

interface ForgotPasswordPayload {
  email: string;
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

interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

interface ResendOtpPayload {
  challengeId: string;
}

export type UserRole = 'admin' | 'manager' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profile_picture: string | null;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface VerifyOtpResponse {
  message: string;
  session?: AuthSession;
  user?: AuthUser;
  resetToken?: string;
}

export interface ResendOtpResponse {
  message: string;
  challengeId: string;
  expiresAt: string;
  maskedEmail: string;
  devOtpCode?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  challengeId: string;
  expiresAt: string;
  maskedEmail: string;
  devOtpCode?: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profile_picture: string | null;
}

const AUTH_SESSION_STORAGE_KEY = 'huerto-auth-session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/auth';

  /** BehaviorSubject that holds the current user data (reactive). */
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUserFromSession());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  requestOtp(payload: SendOtpPayload): Observable<SendOtpResponse> {
    return this.http.post<SendOtpResponse>(`${this.baseUrl}/send-otp`, payload);
  }

  register(payload: RegisterPayload): Observable<SendOtpResponse> {
    return this.http.post<SendOtpResponse>(`${this.baseUrl}/register`, payload);
  }

  verifyOtp(payload: VerifyOtpPayload): Observable<VerifyOtpResponse> {
    return this.http
      .post<VerifyOtpResponse>(`${this.baseUrl}/verify-otp`, payload)
      .pipe(
        tap((response) => {
          if (response.session) {
            this.persistSession(response.session);
            this.currentUserSubject.next(response.session.user);
          }
        })
      );
  }

  resendOtp(payload: ResendOtpPayload): Observable<ResendOtpResponse> {
    return this.http.post<ResendOtpResponse>(`${this.baseUrl}/resend-otp`, payload);
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.baseUrl}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.baseUrl}/reset-password`, payload);
  }

  googleAuth(idToken: string): Observable<VerifyOtpResponse> {
    return this.http
      .post<VerifyOtpResponse>(`${this.baseUrl}/google`, { idToken })
      .pipe(
        tap((response) => {
          if (response.session) {
            this.persistSession(response.session);
            this.currentUserSubject.next(response.session.user);
          }
        })
      );
  }

  /** Fetches fresh user data from the /auth/me endpoint. */
  getMe(): Observable<MeResponse> {
    const session = this.getSession();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${session?.token ?? ''}`
    });
    return this.http.get<MeResponse>(`${this.baseUrl}/me`, { headers }).pipe(
      tap((user) => {
        // Update the stored session user with fresh data
        const currentSession = this.getSession();
        if (currentSession) {
          currentSession.user = {
            ...currentSession.user,
            name: user.name,
            role: user.role,
            profile_picture: user.profile_picture
          };
          this.persistSession(currentSession);
          this.currentUserSubject.next(currentSession.user);
        }
      })
    );
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

  /** Returns the current user's role, or null if not authenticated. */
  getUserRole(): UserRole | null {
    const session = this.getSession();
    return session?.user?.role ?? null;
  }

  /** Returns the current user from the session. */
  getCurrentUser(): AuthUser | null {
    const session = this.getSession();
    return session?.user ?? null;
  }

  /** Returns the current user for the BehaviorSubject. */
  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
    this.currentUserSubject.next(null);
  }

  setSession(session: AuthSession): void {
    this.persistSession(session);
    this.currentUserSubject.next(session.user);
  }

  private persistSession(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  }

  private loadUserFromSession(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const session = JSON.parse(raw) as AuthSession;
      if (!session.token || !session.expiresAt || Date.now() >= Date.parse(session.expiresAt)) {
        return null;
      }
      return session.user ?? null;
    } catch {
      return null;
    }
  }
}
