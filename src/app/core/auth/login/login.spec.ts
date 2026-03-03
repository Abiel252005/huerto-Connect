import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { LoginComponent } from './login';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.showLoginPassword).toBe(false);

    component.toggleLoginPasswordVisibility();
    expect(component.showLoginPassword).toBe(true);

    component.toggleLoginPasswordVisibility();
    expect(component.showLoginPassword).toBe(false);
  });

  it('should not count failed attempt when captcha is invalid', () => {
    component.loginEmail = 'admin@huerto.mx';
    component.loginPassword = 'wrong-password';

    component.onLogin();

    expect(component.failedLoginAttempts).toBe(0);
    expect(component.loginErrorMessage).toContain('Captcha incorrecto');
  });

  it('should lock login after 5 incorrect password attempts', () => {
    component.loginEmail = 'admin@huerto.mx';

    for (let i = 0; i < 5; i++) {
      component.loginPassword = `wrong-${i}`;
      component.captchaInput = (component as any).captchaExpectedAnswer;
      component.onLogin();
    }

    expect(component.failedLoginAttempts).toBe(5);
    expect(component.isLockoutActive).toBe(true);
    expect(component.loginErrorMessage).toContain('Demasiados intentos');
  });

  it('should navigate to admin when credentials and captcha are valid', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.loginEmail = 'admin@huerto.mx';
    component.loginPassword = 'Huerto123!';
    component.captchaInput = (component as any).captchaExpectedAnswer;

    component.onLogin();

    expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
    expect(component.failedLoginAttempts).toBe(0);
  });

  it('should navigate in vulnerable scenario when username is admin_huerto', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.vulnerableUsername = 'admin_huerto';
    component.onVulnerableLogin();

    expect(navigateSpy).toHaveBeenCalledWith(['/admin']);
    expect(component.vulnerableErrorMessage).toBe('');
  });

  it('should show vulnerable scenario error when username is not recognized', () => {
    component.vulnerableUsername = 'otro_usuario';
    component.onVulnerableLogin();

    expect(component.vulnerableErrorMessage).toContain('Usuario no reconocido');
  });
});
