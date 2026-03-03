import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

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
  private static readonly DEMO_LOGIN_EMAIL = 'admin@huerto.mx';
  private static readonly DEMO_LOGIN_PASSWORD = 'Huerto123!';
  private static readonly VULNERABLE_USERNAME = 'admin_huerto';
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 90_000;

  constructor(private readonly router: Router) {}

  isRegister = false;

  // Login Data
  loginEmail = '';
  loginPassword = '';
  showLoginPassword = false;

  failedLoginAttempts = 0;
  lockoutUntil: number | null = null;
  lockoutRemainingSeconds = 0;
  loginErrorMessage = '';

  // Scenario A - Broken Authentication
  vulnerableUsername = '';
  vulnerableErrorMessage = '';

  captchaChallenge = '';
  captchaInput = '';
  private captchaExpectedAnswer = '';
  private lockoutInterval: ReturnType<typeof setInterval> | null = null;

  windXPx = 0;
  windYPx = 0;
  private targetWindXPx = 0;
  private targetWindYPx = 0;
  private windFrame: number | null = null;

  sprouts: SproutParticle[] = this.createSprouts(90);

  get maxLoginAttempts(): number {
    return LoginComponent.MAX_LOGIN_ATTEMPTS;
  }

  get isLockoutActive(): boolean {
    return this.lockoutUntil !== null && Date.now() < this.lockoutUntil;
  }

  get captchaTokens(): { left: string; operator: string; right: string } {
    const [left = '', operator = '', right = ''] = this.captchaChallenge.split(' ');
    return { left, operator, right };
  }

  toggleMode() {
    this.isRegister = !this.isRegister;
  }

  ngOnInit() {
    this.generateCaptcha();
  }

  toggleLoginPasswordVisibility() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  refreshCaptcha() {
    this.generateCaptcha();
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

  onLogin() {
    this.loginErrorMessage = '';

    if (this.isLockoutActive) {
      this.updateLockoutCountdown();
      this.loginErrorMessage = 'Demasiados intentos. Vuelve despues.';
      return;
    }

    if (!this.isCaptchaValid()) {
      this.loginErrorMessage = 'Captcha incorrecto. Resuelve la operación.';
      this.generateCaptcha();
      return;
    }

    if (this.isValidLogin(this.loginEmail, this.loginPassword)) {
      this.resetLoginSecurityState();
      this.router.navigate(['/admin']);
      return;
    }

    this.failedLoginAttempts += 1;
    const remainingAttempts = LoginComponent.MAX_LOGIN_ATTEMPTS - this.failedLoginAttempts;

    if (remainingAttempts <= 0) {
      this.activateLockout();
      this.loginErrorMessage = 'Demasiados intentos. Vuelve despues.';
      return;
    }

    this.loginErrorMessage = 'Correo o contraseña incorrectos.';
    this.generateCaptcha();
  }

  onVulnerableLogin() {
    this.vulnerableErrorMessage = '';

    if (!this.vulnerableUsername.trim()) {
      this.vulnerableErrorMessage = 'Ingresa un nombre de usuario.';
      return;
    }

    if (this.vulnerableUsername.trim().toLowerCase() === LoginComponent.VULNERABLE_USERNAME) {
      this.router.navigate(['/admin']);
      return;
    }

    this.vulnerableErrorMessage = `Usuario no reconocido. Prueba con "${LoginComponent.VULNERABLE_USERNAME}".`;
  }

  ngOnDestroy() {
    if (this.windFrame !== null) {
      cancelAnimationFrame(this.windFrame);
    }

    if (this.lockoutInterval !== null) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
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

  private isValidLogin(email: string, password: string): boolean {
    return (
      email.trim().toLowerCase() === LoginComponent.DEMO_LOGIN_EMAIL &&
      password === LoginComponent.DEMO_LOGIN_PASSWORD
    );
  }

  private isCaptchaValid(): boolean {
    return this.captchaInput.trim() === this.captchaExpectedAnswer;
  }

  private generateCaptcha() {
    const first = Math.floor(Math.random() * 8) + 2;
    const second = Math.floor(Math.random() * 8) + 2;
    const useSum = Math.random() >= 0.5;

    if (useSum) {
      this.captchaChallenge = `${first} + ${second}`;
      this.captchaExpectedAnswer = String(first + second);
    } else {
      const highest = Math.max(first, second);
      const lowest = Math.min(first, second);
      this.captchaChallenge = `${highest} - ${lowest}`;
      this.captchaExpectedAnswer = String(highest - lowest);
    }

    this.captchaInput = '';
  }

  private activateLockout() {
    this.lockoutUntil = Date.now() + LoginComponent.LOCKOUT_DURATION_MS;
    this.updateLockoutCountdown();

    if (this.lockoutInterval !== null) {
      clearInterval(this.lockoutInterval);
    }

    this.lockoutInterval = setInterval(() => {
      this.updateLockoutCountdown();

      if (!this.isLockoutActive) {
        this.resetLoginSecurityState();
      }
    }, 1000);
  }

  private updateLockoutCountdown() {
    if (this.lockoutUntil === null) {
      this.lockoutRemainingSeconds = 0;
      return;
    }

    const remainingMs = this.lockoutUntil - Date.now();
    this.lockoutRemainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

    if (remainingMs <= 0) {
      this.lockoutUntil = null;
      this.lockoutRemainingSeconds = 0;
    }
  }

  private resetLoginSecurityState() {
    this.failedLoginAttempts = 0;
    this.lockoutUntil = null;
    this.lockoutRemainingSeconds = 0;
    this.loginErrorMessage = '';
    this.captchaInput = '';
    this.generateCaptcha();

    if (this.lockoutInterval !== null) {
      clearInterval(this.lockoutInterval);
      this.lockoutInterval = null;
    }
  }
}
