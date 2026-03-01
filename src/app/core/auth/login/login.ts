import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';

interface SproutParticle {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  opacity: number;
  rotate: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent implements OnInit, OnDestroy {
  constructor(private readonly router: Router, private http: HttpClient) { }

  isSafeMode = false;
  errorMessage = '';
  successMessage = '';

  // Vulnerable Login Data
  loginEmail = '';
  loginPassword = '';

  // Safe Login Data
  safeLoginEmail = '';
  safeLoginPassword = '';

  // State of password visibility
  showLoginPassword = false;
  showSafeLoginPassword = false;

  // API Connection Status
  apiConnected: boolean | null = null; // null = checking, true = online, false = offline
  private healthSub?: Subscription;
  private dbBootstrapPromise?: Promise<void>;

  windXPx = 0;
  windYPx = 0;
  private targetWindXPx = 0;
  private targetWindYPx = 0;
  private windFrame: number | null = null;

  sprouts: SproutParticle[] = this.createSprouts(90);

  toggleMode() {
    this.isSafeMode = !this.isSafeMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  toggleLoginPassword() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleSafeLoginPassword() {
    this.showSafeLoginPassword = !this.showSafeLoginPassword;
  }

  ngOnInit() {
    void this.ensureDemoDbReady();
    this.checkApiStatus();
    // Poll every 5 seconds to keep the UI up to date
    this.healthSub = interval(5000).subscribe(() => this.checkApiStatus());
  }

  checkApiStatus() {
    this.http.get<any>(`${this.apiUrl}/health`).subscribe({
      next: (res) => {
        // Validate it's actually our API and not another service sitting on :3000
        if (res && res.service === "SQLi Practica API") {
          this.apiConnected = true;
        } else {
          this.apiConnected = false;
        }
      },
      error: () => {
        this.apiConnected = false;
      }
    });
  }

  onPointerMove(event: PointerEvent) {
    const target = event.currentTarget as HTMLElement;
    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100;
    const centeredX = (Math.max(0, Math.min(100, xPct)) - 50) / 50;
    const centeredY = (Math.max(0, Math.min(100, yPct)) - 50) / 50;
    this.targetWindXPx = centeredX * 5;
    this.targetWindYPx = centeredY * 3;
    this.startWindLoop();
  }

  onPointerLeave() {
    this.targetWindXPx = 0;
    this.targetWindYPx = 0;
    this.startWindLoop();
  }

  private readonly apiUrl = 'http://localhost:3000';

  onLoginVulnerable() {
    this.errorMessage = '';
    this.successMessage = '';
    console.log('Sending Vulnerable Login Request:', { correo: this.loginEmail, password: this.loginPassword });

    void this.ensureDemoDbReady().then(() => {
      this.http.post<any>(`${this.apiUrl}/login-vuln`, {
        correo: this.loginEmail,
        password: this.loginPassword
      }).subscribe({
        next: (res: any) => {
          console.log('Success response:', res);
          this.handleLoginSuccess(res);
        },
        error: (err: any) => {
          console.error('Login Error:', err);
          this.errorMessage = this.resolveLoginError(err, 'Error de conexión o login incorrecto');
        }
      });
    });
  }

  onLoginSafe() {
    this.errorMessage = '';
    this.successMessage = '';
    console.log('Sending Safe Login Request:', { correo: this.safeLoginEmail, password: this.safeLoginPassword });

    void this.ensureDemoDbReady().then(() => {
      this.http.post<any>(`${this.apiUrl}/login-safe`, {
        correo: this.safeLoginEmail,
        password: this.safeLoginPassword
      }).subscribe({
        next: (res: any) => {
          console.log('Success response:', res);
          this.handleLoginSuccess(res);
        },
        error: (err: any) => {
          console.error('Safe Login Error:', err);
          this.errorMessage = this.resolveLoginError(err, '¡Conexión denegada por seguridad!');
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.healthSub) {
      this.healthSub.unsubscribe();
    }
    if (this.windFrame !== null) {
      cancelAnimationFrame(this.windFrame);
    }
  }

  private startWindLoop() {
    if (this.windFrame !== null) {
      return;
    }
    this.windFrame = requestAnimationFrame(() => this.stepWind());
  }

  private stepWind() {
    const damping = 0.12;
    this.windXPx += (this.targetWindXPx - this.windXPx) * damping;
    this.windYPx += (this.targetWindYPx - this.windYPx) * damping;

    const closeX = Math.abs(this.targetWindXPx - this.windXPx) < 0.08;
    const closeY = Math.abs(this.targetWindYPx - this.windYPx) < 0.08;

    if (closeX && closeY) {
      this.windXPx = this.targetWindXPx;
      this.windYPx = this.targetWindYPx;
      this.windFrame = null;
      return;
    }

    this.windFrame = requestAnimationFrame(() => this.stepWind());
  }

  private createSprouts(count: number): SproutParticle[] {
    const items: SproutParticle[] = [];
    let seed = 123456789;

    const rand = () => {
      seed = (1664525 * seed + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const phase = rand() * Math.PI * 2;
      const size = 14 + rand() * 16;
      const duration = 14 + rand() * 12;
      items.push({
        x: Number((rand() * 100).toFixed(2)),
        y: Number((-15 + rand() * 20).toFixed(2)),
        size: Number(size.toFixed(2)),
        delay: Number((-(rand() * duration)).toFixed(2)),
        duration: Number(duration.toFixed(2)),
        driftX: Number(((rand() - 0.5) * 18).toFixed(2)),
        driftY: Number((8 + rand() * 14).toFixed(2)),
        opacity: Number((0.22 + rand() * 0.32).toFixed(2)),
        rotate: Number((rand() * 360).toFixed(2))
      });
    }

    return items;
  }

  private resolveLoginError(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error || fallback;
  }

  private handleLoginSuccess(res: any) {
    this.successMessage = 'Conexión Exitosa: ' + (res?.message || 'Login autorizado.');
    this.errorMessage = '';

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        'sqli-demo-user',
        JSON.stringify({
          correo: res?.user?.correo ?? null,
          rol: res?.user?.rol ?? null
        })
      );
    }

    this.router.navigate(['/admin/dashboard']);
  }

  private ensureDemoDbReady(): Promise<void> {
    if (this.dbBootstrapPromise) {
      return this.dbBootstrapPromise;
    }

    this.dbBootstrapPromise = new Promise((resolve) => {
      this.http.post<any>(`${this.apiUrl}/setup`, {}).subscribe({
        next: () => resolve(),
        error: (err: any) => {
          console.warn('No se pudo inicializar /setup automáticamente:', err);
          resolve();
        }
      });
    });

    return this.dbBootstrapPromise;
  }
}
