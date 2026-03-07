import { CUSTOM_ELEMENTS_SCHEMA, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, SendOtpResponse } from '../services/auth.service';

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
export class LoginComponent implements OnDestroy {
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/admin']);
    }
  }

  isRegister = false;

  // Login Data
  loginEmail = '';
  loginPassword = '';
  otpCode = '';
  readonly codeIndexes = [0, 1, 2, 3, 4, 5];
  codeDigits = ['', '', '', '', '', ''];

  authStep: 'credentials' | 'otp' | 'forgot-email' | 'forgot-otp' | 'forgot-reset' = 'credentials';
  otpChallengeId = '';
  maskedLoginEmail = '';
  otpCountdownText = '05:00';
  canResendOtp = false;
  loginInfoMessage = '';

  forgotEmail = '';
  forgotChallengeId = '';
  forgotMaskedEmail = '';
  forgotOtpCode = '';
  forgotCodeDigits = ['', '', '', '', '', ''];
  forgotResetToken = '';
  forgotOtpCountdownText = '05:00';
  canResendForgotOtp = false;
  forgotNewPassword = '';
  forgotConfirmPassword = '';

  isSubmittingLogin = false;
  isVerifyingOtp = false;
  isResendingOtp = false;
  isSubmittingForgotRequest = false;
  isVerifyingForgotOtp = false;
  isResendingForgotOtp = false;
  isSubmittingPasswordReset = false;

  loginErrorMessage = '';
  otpErrorMessage = '';
  otpInfoMessage = '';
  forgotErrorMessage = '';
  forgotInfoMessage = '';

  // Register Data
  registerName = '';
  registerApellidos = '';
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';

  registerStep: 'form' | 'otp' = 'form';
  registerChallengeId = '';
  maskedRegisterEmail = '';
  regOtpCountdownText = '05:00';
  canResendRegisterOtp = false;

  isSubmittingRegister = false;
  isVerifyingRegisterOtp = false;
  isResendingRegisterOtp = false;

  registerErrorMessage = '';
  regOtpErrorMessage = '';
  regOtpInfoMessage = '';

  regCodeDigits = ['', '', '', '', '', ''];
  private regOtpCode = '';

  passwordStrength: { percent: number; level: string; label: string } = {
    percent: 0,
    level: 'weak',
    label: ''
  };

  windXPx = 0;
  windYPx = 0;
  private targetWindXPx = 0;
  private targetWindYPx = 0;
  private windFrame: number | null = null;
  private otpExpiresAtMs = 0;
  private otpCountdownFrame: number | null = null;
  private forgotOtpExpiresAtMs = 0;
  private forgotOtpCountdownFrame: number | null = null;
  private regOtpExpiresAtMs = 0;
  private regOtpCountdownFrame: number | null = null;

  sprouts: SproutParticle[] = this.createSprouts(90);

  toggleMode() {
    this.isRegister = !this.isRegister;
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

  onAuthSubmit() {
    if (this.authStep === 'credentials') {
      this.onLogin();
      return;
    }

    if (this.authStep === 'otp') {
      this.onVerifyOtp();
      return;
    }

    if (this.authStep === 'forgot-email') {
      this.onRequestPasswordResetOtp();
      return;
    }

    if (this.authStep === 'forgot-otp') {
      this.onVerifyForgotOtp();
      return;
    }

    this.onSubmitNewPassword();
  }

  onLogin() {
    if (this.authStep !== 'credentials' || this.isSubmittingLogin) {
      return;
    }

    const email = this.loginEmail.trim().toLowerCase();
    const password = this.loginPassword;

    this.loginErrorMessage = '';
    this.loginInfoMessage = '';
    this.otpErrorMessage = '';
    this.otpInfoMessage = '';

    if (!email || !password) {
      this.loginErrorMessage = 'Ingresa correo y contrasena para continuar.';
      return;
    }

    this.enterOtpStepPending(email);
    this.isSubmittingLogin = true;
    this.authService.requestOtp({ email, password }).subscribe({
      next: (response) => {
        this.isSubmittingLogin = false;
        this.configureOtpStep(response);
      },
      error: (error: unknown) => {
        this.isSubmittingLogin = false;
        this.authStep = 'credentials';
        this.otpChallengeId = '';
        this.otpCode = '';
        this.canResendOtp = false;
        this.stopOtpTimer();
        this.loginErrorMessage = this.extractErrorMessage(error, 'No fue posible iniciar sesion.');
      }
    });
  }

  onStartForgotPassword() {
    this.resetForgotPasswordFlow();
    this.authStep = 'forgot-email';
    this.forgotEmail = this.loginEmail.trim().toLowerCase();
    this.loginErrorMessage = '';
    this.loginInfoMessage = '';
    this.otpErrorMessage = '';
    this.otpInfoMessage = '';
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';
  }

  onRequestPasswordResetOtp() {
    if (this.authStep !== 'forgot-email' || this.isSubmittingForgotRequest) {
      return;
    }

    const email = this.forgotEmail.trim().toLowerCase();
    this.forgotChallengeId = '';
    this.forgotResetToken = '';
    this.canResendForgotOtp = false;
    this.stopForgotOtpTimer();
    this.setForgotCodeDigits('');
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';

    if (!email) {
      this.forgotErrorMessage = 'Ingresa tu correo para recuperar la contraseña.';
      return;
    }

    this.enterForgotOtpStepPending(email);
    this.isSubmittingForgotRequest = true;
    this.authService.forgotPassword({ email }).subscribe({
      next: (response) => {
        this.isSubmittingForgotRequest = false;
        this.forgotEmail = email;
        this.forgotMaskedEmail = response.maskedEmail || this.maskEmailForDisplay(email);

        if (!response.challengeId) {
          this.forgotChallengeId = '';
          this.setForgotCodeDigits('');
          this.stopForgotOtpTimer();
          this.forgotInfoMessage = response.message;
          return;
        }

        this.authStep = 'forgot-otp';
        this.forgotChallengeId = response.challengeId;
        this.setForgotCodeDigits(response.devOtpCode ?? '');
        this.forgotInfoMessage = this.buildOtpInfoMessage(
          response.devOtpCode,
          'Ingresa el código que enviamos a tu correo para cambiar tu contraseña.'
        );
        this.canResendForgotOtp = false;
        this.configureForgotOtpTimer(response.expiresAt);
      },
      error: (error: unknown) => {
        this.isSubmittingForgotRequest = false;
        this.forgotErrorMessage = this.extractErrorMessage(
          error,
          'No fue posible iniciar la recuperacion de contraseña.'
        );
        this.authStep = 'forgot-email';
      }
    });
  }

  onVerifyForgotOtp() {
    if (this.authStep !== 'forgot-otp' || this.isVerifyingForgotOtp) {
      return;
    }

    if (!this.forgotChallengeId) {
      this.forgotInfoMessage = 'Estamos enviando tu código. Espera unos segundos.';
      return;
    }

    this.syncForgotOtpCodeFromDigits();
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';

    if (this.forgotOtpCode.length !== 6) {
      this.forgotErrorMessage = 'Ingresa el código de 6 dígitos.';
      return;
    }

    this.isVerifyingForgotOtp = true;
    this.authService
      .verifyOtp({
        challengeId: this.forgotChallengeId,
        otpCode: this.forgotOtpCode
      })
      .subscribe({
        next: (response) => {
          this.isVerifyingForgotOtp = false;

          if (!response.resetToken) {
            this.forgotErrorMessage = 'No fue posible validar el código. Solicita uno nuevo.';
            this.canResendForgotOtp = true;
            return;
          }

          this.forgotResetToken = response.resetToken;
          this.forgotNewPassword = '';
          this.forgotConfirmPassword = '';
          this.authStep = 'forgot-reset';
          this.forgotInfoMessage = 'Código verificado. Define tu nueva contraseña.';
          this.stopForgotOtpTimer();
        },
        error: (error: unknown) => {
          this.isVerifyingForgotOtp = false;
          this.canResendForgotOtp = true;
          this.forgotErrorMessage = this.extractErrorMessage(
            error,
            'No fue posible verificar el código.'
          );
        }
      });
  }

  onSubmitNewPassword() {
    if (this.authStep !== 'forgot-reset' || this.isSubmittingPasswordReset) {
      return;
    }

    const newPassword = this.forgotNewPassword;
    const confirmPassword = this.forgotConfirmPassword;

    this.forgotErrorMessage = '';

    if (!this.forgotResetToken) {
      this.forgotErrorMessage = 'El proceso de recuperación expiró. Solicita un nuevo código.';
      return;
    }

    if (newPassword.length < 6) {
      this.forgotErrorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.forgotErrorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.isSubmittingPasswordReset = true;
    this.authService.resetPassword({ resetToken: this.forgotResetToken, newPassword }).subscribe({
      next: (response) => {
        this.isSubmittingPasswordReset = false;
        const recoveredEmail = this.forgotEmail.trim().toLowerCase();
        this.resetForgotPasswordFlow();
        this.authStep = 'credentials';
        this.loginEmail = recoveredEmail;
        this.loginPassword = '';
        this.loginErrorMessage = '';
        this.loginInfoMessage = response.message;
      },
      error: (error: unknown) => {
        this.isSubmittingPasswordReset = false;
        this.forgotErrorMessage = this.extractErrorMessage(
          error,
          'No fue posible actualizar la contraseña.'
        );
      }
    });
  }

  onResendForgotOtp() {
    if (!this.forgotChallengeId || !this.canResendForgotOtp || this.isResendingForgotOtp) {
      return;
    }

    this.isResendingForgotOtp = true;
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';

    this.authService.resendOtp({ challengeId: this.forgotChallengeId }).subscribe({
      next: (response) => {
        this.isResendingForgotOtp = false;
        this.canResendForgotOtp = false;
        this.setForgotCodeDigits(response.devOtpCode ?? '');
        this.forgotMaskedEmail = response.maskedEmail;
        this.configureForgotOtpTimer(response.expiresAt);
        this.forgotInfoMessage = this.buildOtpInfoMessage(
          response.devOtpCode,
          'Te enviamos un nuevo código para recuperar tu cuenta.'
        );
      },
      error: (error: unknown) => {
        this.isResendingForgotOtp = false;
        this.forgotErrorMessage = this.extractErrorMessage(error, 'No fue posible reenviar el código.');
      }
    });
  }

  onBackToForgotEmail() {
    this.authStep = 'forgot-email';
    this.forgotChallengeId = '';
    this.forgotResetToken = '';
    this.canResendForgotOtp = false;
    this.setForgotCodeDigits('');
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';
    this.stopForgotOtpTimer();
  }

  onCancelForgotPassword() {
    this.authStep = 'credentials';
    this.resetForgotPasswordFlow();
  }

  onForgotCodeDigitInput(index: number, value: string) {
    if (!this.forgotChallengeId) {
      return;
    }

    const normalized = value.replace(/\D/g, '').slice(-1);
    this.forgotCodeDigits[index] = normalized;
    this.syncForgotOtpCodeFromDigits();

    if (normalized && index < this.forgotCodeDigits.length - 1) {
      this.focusForgotCodeDigit(index + 1);
    }
  }

  onForgotCodeDigitKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.forgotCodeDigits[index] && index > 0) {
      this.focusForgotCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusForgotCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < this.forgotCodeDigits.length - 1) {
      event.preventDefault();
      this.focusForgotCodeDigit(index + 1);
    }
  }

  onForgotCodeDigitsPaste(event: ClipboardEvent) {
    if (!this.forgotChallengeId) {
      return;
    }

    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const normalized = pasted.replace(/\D/g, '').slice(0, this.forgotCodeDigits.length);
    this.setForgotCodeDigits(normalized);

    const nextIndex = Math.min(normalized.length, this.forgotCodeDigits.length - 1);
    this.focusForgotCodeDigit(nextIndex);
  }

  onRegister() {
    if (this.registerStep !== 'form' || this.isSubmittingRegister) {
      return;
    }

    const nombre = this.registerName.trim();
    const apellidos = this.registerApellidos.trim();
    const email = this.registerEmail.trim().toLowerCase();
    const password = this.registerPassword;
    const confirmPassword = this.registerConfirmPassword;

    this.registerErrorMessage = '';

    if (!nombre) {
      this.registerErrorMessage = 'El nombre es requerido.';
      return;
    }

    if (!email) {
      this.registerErrorMessage = 'El correo electrónico es requerido.';
      return;
    }

    if (password.length < 6) {
      this.registerErrorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (password !== confirmPassword) {
      this.registerErrorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.isSubmittingRegister = true;
    this.registerStep = 'otp';
    this.maskedRegisterEmail = this.maskEmailForDisplay(email);
    this.setRegCodeDigits('');
    this.regOtpInfoMessage = 'Enviando código de verificación...';
    this.regOtpErrorMessage = '';

    this.authService.register({ nombre, apellidos, email, password }).subscribe({
      next: (response) => {
        this.isSubmittingRegister = false;
        this.registerChallengeId = response.challengeId;
        this.maskedRegisterEmail = response.maskedEmail;
        this.setRegCodeDigits(response.devOtpCode ?? '');
        this.regOtpInfoMessage = this.buildOtpInfoMessage(
          response.devOtpCode,
          'Ingresa el código que enviamos a tu correo para activar tu cuenta.'
        );
        this.canResendRegisterOtp = false;
        this.configureRegOtpTimer(response.expiresAt);
      },
      error: (error: unknown) => {
        this.isSubmittingRegister = false;
        this.registerStep = 'form';
        this.registerChallengeId = '';
        this.regOtpInfoMessage = '';
        this.registerErrorMessage = this.extractErrorMessage(error, 'No fue posible crear la cuenta.');
      }
    });
  }

  onVerifyRegisterOtp() {
    if (this.registerStep !== 'otp' || this.isVerifyingRegisterOtp) {
      return;
    }

    if (!this.registerChallengeId) {
      this.regOtpInfoMessage = 'Estamos enviando tu código. Espera unos segundos.';
      return;
    }

    this.syncRegOtpCodeFromDigits();
    this.regOtpErrorMessage = '';
    this.regOtpInfoMessage = '';

    if (this.regOtpCode.length !== 6) {
      this.regOtpErrorMessage = 'Ingresa el código de 6 dígitos.';
      return;
    }

    this.isVerifyingRegisterOtp = true;
    this.authService
      .verifyOtp({
        challengeId: this.registerChallengeId,
        otpCode: this.regOtpCode
      })
      .subscribe({
        next: (response) => {
          if (!response.session) {
            this.isVerifyingRegisterOtp = false;
            this.regOtpErrorMessage = 'No fue posible crear la sesion. Intenta nuevamente.';
            return;
          }

          this.isVerifyingRegisterOtp = false;
          this.stopRegOtpTimer();
          this.registerPassword = '';
          this.registerConfirmPassword = '';
          this.setRegCodeDigits('');
          void this.router.navigate(['/admin']);
        },
        error: (error: unknown) => {
          this.isVerifyingRegisterOtp = false;
          this.canResendRegisterOtp = true;
          this.regOtpErrorMessage = this.extractErrorMessage(
            error,
            'No fue posible verificar el código.'
          );
        }
      });
  }

  onResendRegisterOtp() {
    if (!this.registerChallengeId || !this.canResendRegisterOtp || this.isResendingRegisterOtp) {
      return;
    }

    this.isResendingRegisterOtp = true;
    this.regOtpErrorMessage = '';
    this.regOtpInfoMessage = '';

    this.authService.resendOtp({ challengeId: this.registerChallengeId }).subscribe({
      next: (response) => {
        this.isResendingRegisterOtp = false;
        this.canResendRegisterOtp = false;
        this.setRegCodeDigits(response.devOtpCode ?? '');
        this.maskedRegisterEmail = response.maskedEmail;
        this.configureRegOtpTimer(response.expiresAt);
        this.regOtpInfoMessage = this.buildOtpInfoMessage(
          response.devOtpCode,
          'Te enviamos un nuevo código a tu correo.'
        );
      },
      error: (error: unknown) => {
        this.isResendingRegisterOtp = false;
        this.regOtpErrorMessage = this.extractErrorMessage(error, 'No fue posible reenviar el código.');
      }
    });
  }

  onBackToRegisterForm() {
    this.registerStep = 'form';
    this.registerChallengeId = '';
    this.setRegCodeDigits('');
    this.regOtpInfoMessage = '';
    this.regOtpErrorMessage = '';
    this.canResendRegisterOtp = false;
    this.stopRegOtpTimer();
  }

  onRegCodeDigitInput(index: number, value: string) {
    if (!this.registerChallengeId) {
      return;
    }

    const normalized = value.replace(/\D/g, '').slice(-1);
    this.regCodeDigits[index] = normalized;
    this.syncRegOtpCodeFromDigits();

    if (normalized && index < this.regCodeDigits.length - 1) {
      this.focusRegCodeDigit(index + 1);
    }
  }

  onRegCodeDigitKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.regCodeDigits[index] && index > 0) {
      this.focusRegCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusRegCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < this.regCodeDigits.length - 1) {
      event.preventDefault();
      this.focusRegCodeDigit(index + 1);
    }
  }

  onRegCodeDigitsPaste(event: ClipboardEvent) {
    if (!this.registerChallengeId) {
      return;
    }

    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const normalized = pasted.replace(/\D/g, '').slice(0, this.regCodeDigits.length);
    this.setRegCodeDigits(normalized);

    const nextIndex = Math.min(normalized.length, this.regCodeDigits.length - 1);
    this.focusRegCodeDigit(nextIndex);
  }

  updatePasswordStrength() {
    const p = this.registerPassword;
    let score = 0;

    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    const levels: { level: string; label: string; percent: number }[] = [
      { level: 'weak', label: 'Débil', percent: 20 },
      { level: 'weak', label: 'Débil', percent: 30 },
      { level: 'fair', label: 'Regular', percent: 50 },
      { level: 'good', label: 'Buena', percent: 75 },
      { level: 'strong', label: 'Fuerte', percent: 100 }
    ];

    const index = Math.min(score, levels.length - 1);
    this.passwordStrength = levels[index];
  }

  onVerifyOtp() {
    if (this.authStep !== 'otp' || this.isVerifyingOtp) {
      return;
    }

    if (!this.otpChallengeId) {
      this.otpInfoMessage = 'Estamos enviando tu codigo. Espera unos segundos.';
      return;
    }

    this.syncOtpCodeFromDigits();
    this.otpErrorMessage = '';
    this.otpInfoMessage = '';

    if (this.otpCode.length !== 6) {
      this.otpErrorMessage = 'Ingresa el codigo de 6 digitos.';
      return;
    }

    this.isVerifyingOtp = true;
    this.authService
      .verifyOtp({
        challengeId: this.otpChallengeId,
        otpCode: this.otpCode
      })
      .subscribe({
        next: (response) => {
          if (!response.session) {
            this.isVerifyingOtp = false;
            this.otpErrorMessage = 'No fue posible crear la sesion. Solicita un nuevo codigo.';
            this.canResendOtp = true;
            return;
          }

          this.isVerifyingOtp = false;
          this.stopOtpTimer();
          this.loginPassword = '';
          this.setCodeDigits('');
          void this.router.navigate(['/admin']);
        },
        error: (error: unknown) => {
          this.isVerifyingOtp = false;
          this.canResendOtp = true;
          this.otpErrorMessage = this.extractErrorMessage(
            error,
            'No fue posible verificar el codigo.'
          );
        }
      });
  }

  onResendOtp() {
    if (!this.otpChallengeId || !this.canResendOtp || this.isResendingOtp) {
      return;
    }

    this.isResendingOtp = true;
    this.otpErrorMessage = '';
    this.otpInfoMessage = '';

    this.authService.resendOtp({ challengeId: this.otpChallengeId }).subscribe({
      next: (response) => {
        this.isResendingOtp = false;
        this.canResendOtp = false;
        this.setCodeDigits(response.devOtpCode ?? '');
        this.maskedLoginEmail = response.maskedEmail;
        this.configureOtpTimer(response.expiresAt);
        this.otpInfoMessage = this.buildOtpInfoMessage(
          response.devOtpCode,
          'Te enviamos un nuevo codigo a tu correo.'
        );
      },
      error: (error: unknown) => {
        this.isResendingOtp = false;
        this.otpErrorMessage = this.extractErrorMessage(error, 'No fue posible reenviar el codigo.');
      }
    });
  }

  onCodeDigitInput(index: number, value: string) {
    if (this.isSubmittingLogin || !this.otpChallengeId) {
      return;
    }

    const normalized = value.replace(/\D/g, '').slice(-1);
    this.codeDigits[index] = normalized;
    this.syncOtpCodeFromDigits();

    if (normalized && index < this.codeDigits.length - 1) {
      this.focusCodeDigit(index + 1);
    }
  }

  onCodeDigitKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.codeDigits[index] && index > 0) {
      this.focusCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < this.codeDigits.length - 1) {
      event.preventDefault();
      this.focusCodeDigit(index + 1);
    }
  }

  onCodeDigitsPaste(event: ClipboardEvent) {
    if (this.isSubmittingLogin || !this.otpChallengeId) {
      return;
    }

    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const normalized = pasted.replace(/\D/g, '').slice(0, this.codeDigits.length);
    this.setCodeDigits(normalized);

    const nextIndex = Math.min(normalized.length, this.codeDigits.length - 1);
    this.focusCodeDigit(nextIndex);
  }

  onBackToCredentials() {
    this.authStep = 'credentials';
    this.otpChallengeId = '';
    this.setCodeDigits('');
    this.otpInfoMessage = '';
    this.otpErrorMessage = '';
    this.canResendOtp = false;
    this.stopOtpTimer();
  }

  ngOnDestroy() {
    if (this.windFrame !== null) {
      cancelAnimationFrame(this.windFrame);
    }

    this.stopOtpTimer();
    this.stopForgotOtpTimer();
    this.stopRegOtpTimer();
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

  private configureOtpStep(response: SendOtpResponse) {
    this.authStep = 'otp';
    this.otpChallengeId = response.challengeId;
    this.maskedLoginEmail = response.maskedEmail;
    this.setCodeDigits(response.devOtpCode ?? '');
    this.otpErrorMessage = '';
    this.otpInfoMessage = this.buildOtpInfoMessage(
      response.devOtpCode,
      'Ingresa el codigo que enviamos a tu correo para completar el acceso.'
    );
    this.canResendOtp = false;
    this.configureOtpTimer(response.expiresAt);
  }

  private enterOtpStepPending(email: string) {
    this.authStep = 'otp';
    this.otpChallengeId = '';
    this.maskedLoginEmail = this.maskEmailForDisplay(email);
    this.setCodeDigits('');
    this.otpErrorMessage = '';
    this.otpInfoMessage = 'Enviando codigo a tu correo...';
    this.canResendOtp = false;
    this.stopOtpTimer();
  }

  private enterForgotOtpStepPending(email: string) {
    this.authStep = 'forgot-otp';
    this.forgotChallengeId = '';
    this.forgotMaskedEmail = this.maskEmailForDisplay(email);
    this.setForgotCodeDigits('');
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = 'Enviando código a tu correo...';
    this.canResendForgotOtp = false;
    this.stopForgotOtpTimer();
  }

  private configureOtpTimer(expiresAtIso: string) {
    const parsedExpiresAt = Date.parse(expiresAtIso);
    this.otpExpiresAtMs = Number.isNaN(parsedExpiresAt)
      ? Date.now() + 5 * 60 * 1000
      : parsedExpiresAt;

    this.updateOtpCountdown();
    this.stopOtpTimer();

    if (typeof window !== 'undefined') {
      this.otpCountdownFrame = window.setInterval(() => this.updateOtpCountdown(), 1000);
    }
  }

  private updateOtpCountdown() {
    const remainingMs = Math.max(0, this.otpExpiresAtMs - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    this.otpCountdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (remainingMs === 0) {
      this.canResendOtp = true;
      this.stopOtpTimer();
      if (!this.otpErrorMessage) {
        this.otpInfoMessage = 'Tu codigo expiro. Solicita uno nuevo para continuar.';
      }
    }
  }

  private stopOtpTimer() {
    if (this.otpCountdownFrame !== null && typeof window !== 'undefined') {
      window.clearInterval(this.otpCountdownFrame);
      this.otpCountdownFrame = null;
    }
  }

  private configureForgotOtpTimer(expiresAtIso: string) {
    const parsed = Date.parse(expiresAtIso);
    this.forgotOtpExpiresAtMs = Number.isNaN(parsed)
      ? Date.now() + 5 * 60 * 1000
      : parsed;

    this.updateForgotOtpCountdown();
    this.stopForgotOtpTimer();

    if (typeof window !== 'undefined') {
      this.forgotOtpCountdownFrame = window.setInterval(() => this.updateForgotOtpCountdown(), 1000);
    }
  }

  private updateForgotOtpCountdown() {
    const remainingMs = Math.max(0, this.forgotOtpExpiresAtMs - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    this.forgotOtpCountdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (remainingMs === 0) {
      this.canResendForgotOtp = true;
      this.stopForgotOtpTimer();
      if (!this.forgotErrorMessage) {
        this.forgotInfoMessage = 'Tu código expiró. Solicita uno nuevo para continuar.';
      }
    }
  }

  private stopForgotOtpTimer() {
    if (this.forgotOtpCountdownFrame !== null && typeof window !== 'undefined') {
      window.clearInterval(this.forgotOtpCountdownFrame);
      this.forgotOtpCountdownFrame = null;
    }
  }

  private normalizeOtpCode(value: string): string {
    return value.replace(/\D/g, '').slice(0, 6);
  }

  private extractErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return fallbackMessage;
  }

  private buildOtpInfoMessage(devOtpCode: string | undefined, baseMessage: string): string {
    if (!devOtpCode) {
      return baseMessage;
    }

    return `${baseMessage} (Codigo de prueba: ${devOtpCode})`;
  }

  private maskEmailForDisplay(email: string): string {
    const [rawLocalPart = '', rawDomain = ''] = email.split('@');
    const localPart = rawLocalPart.trim();
    const domain = rawDomain.trim();

    if (!localPart || !domain) {
      return email;
    }

    if (localPart.length <= 2) {
      return `${localPart[0] ?? '*'}*@${domain}`;
    }

    return `${localPart.slice(0, 2)}***${localPart.slice(-1)}@${domain}`;
  }

  private setCodeDigits(code: string) {
    const normalized = this.normalizeOtpCode(code);
    this.codeDigits = this.codeDigits.map((_, index) => normalized[index] ?? '');
    this.syncOtpCodeFromDigits();
  }

  private syncOtpCodeFromDigits() {
    this.otpCode = this.codeDigits.join('');
  }

  private focusCodeDigit(index: number) {
    if (typeof document === 'undefined') {
      return;
    }

    const element = document.getElementById(`code-digit-${index}`) as HTMLInputElement | null;
    if (!element) {
      return;
    }

    element.focus();
    element.select();
  }

  private setForgotCodeDigits(code: string) {
    const normalized = this.normalizeOtpCode(code);
    this.forgotCodeDigits = this.forgotCodeDigits.map((_, index) => normalized[index] ?? '');
    this.syncForgotOtpCodeFromDigits();
  }

  private syncForgotOtpCodeFromDigits() {
    this.forgotOtpCode = this.forgotCodeDigits.join('');
  }

  private focusForgotCodeDigit(index: number) {
    if (typeof document === 'undefined') {
      return;
    }

    const element = document.getElementById(`forgot-code-digit-${index}`) as HTMLInputElement | null;
    if (!element) {
      return;
    }

    element.focus();
    element.select();
  }

  private configureRegOtpTimer(expiresAtIso: string) {
    const parsed = Date.parse(expiresAtIso);
    this.regOtpExpiresAtMs = Number.isNaN(parsed)
      ? Date.now() + 5 * 60 * 1000
      : parsed;

    this.updateRegOtpCountdown();
    this.stopRegOtpTimer();

    if (typeof window !== 'undefined') {
      this.regOtpCountdownFrame = window.setInterval(() => this.updateRegOtpCountdown(), 1000);
    }
  }

  private updateRegOtpCountdown() {
    const remainingMs = Math.max(0, this.regOtpExpiresAtMs - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    this.regOtpCountdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (remainingMs === 0) {
      this.canResendRegisterOtp = true;
      this.stopRegOtpTimer();
      if (!this.regOtpErrorMessage) {
        this.regOtpInfoMessage = 'Tu código expiró. Solicita uno nuevo para continuar.';
      }
    }
  }

  private stopRegOtpTimer() {
    if (this.regOtpCountdownFrame !== null && typeof window !== 'undefined') {
      window.clearInterval(this.regOtpCountdownFrame);
      this.regOtpCountdownFrame = null;
    }
  }

  private setRegCodeDigits(code: string) {
    const normalized = this.normalizeOtpCode(code);
    this.regCodeDigits = this.regCodeDigits.map((_, index) => normalized[index] ?? '');
    this.syncRegOtpCodeFromDigits();
  }

  private syncRegOtpCodeFromDigits() {
    this.regOtpCode = this.regCodeDigits.join('');
  }

  private focusRegCodeDigit(index: number) {
    if (typeof document === 'undefined') {
      return;
    }

    const el = document.getElementById(`reg-code-digit-${index}`) as HTMLInputElement | null;
    if (!el) {
      return;
    }

    el.focus();
    el.select();
  }

  private resetForgotPasswordFlow() {
    this.stopForgotOtpTimer();
    this.forgotEmail = '';
    this.forgotChallengeId = '';
    this.forgotMaskedEmail = '';
    this.forgotOtpCode = '';
    this.setForgotCodeDigits('');
    this.forgotResetToken = '';
    this.forgotOtpCountdownText = '05:00';
    this.canResendForgotOtp = false;
    this.forgotNewPassword = '';
    this.forgotConfirmPassword = '';
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';
    this.isSubmittingForgotRequest = false;
    this.isVerifyingForgotOtp = false;
    this.isResendingForgotOtp = false;
    this.isSubmittingPasswordReset = false;
  }
}
