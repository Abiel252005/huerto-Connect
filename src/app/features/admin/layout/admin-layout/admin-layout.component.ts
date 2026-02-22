import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastNotificationComponent } from '../../components/toast-notification/toast-notification.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  accent: string;
  accentLight: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ToastNotificationComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminLayoutComponent {
  private static readonly THEME_STORAGE_KEY = 'huerto-admin-theme';
  private readonly router = inject(Router);

  theme: 'dark' | 'light' = this.loadTheme();

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'grid-outline', route: '/admin/dashboard', accent: '#00f7ff', accentLight: '#0f6c77' },
    { label: 'Usuarios', icon: 'people-outline', route: '/admin/usuarios', accent: '#2d8bff', accentLight: '#1e5e9d' },
    { label: 'Huertos', icon: 'leaf-outline', route: '/admin/huertos', accent: '#00ffa3', accentLight: '#0a8e5f' },
    { label: 'Regiones y Ubicacion', icon: 'earth-outline', route: '/admin/regiones', accent: '#8f7bff', accentLight: '#5f4fb8' },
    { label: 'Deteccion de Plagas (IA)', icon: 'bug-outline', route: '/admin/plagas', accent: '#22e48e', accentLight: '#0f8a54' },
    { label: 'Chatbot IA', icon: 'chatbubbles-outline', route: '/admin/chatbot', accent: '#3cd1ff', accentLight: '#1474a7' },
    { label: 'Estadisticas', icon: 'stats-chart-outline', route: '/admin/estadisticas', accent: '#ffc857', accentLight: '#9a7112' },
    { label: 'Reportes', icon: 'document-text-outline', route: '/admin/reportes', accent: '#5ef2d6', accentLight: '#0e7f68' }
  ];



  get themeIcon(): string {
    return this.theme === 'dark' ? 'sunny-outline' : 'moon-outline';
  }

  get themeLabel(): string {
    return this.theme === 'dark' ? 'Tema claro' : 'Tema oscuro';
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AdminLayoutComponent.THEME_STORAGE_KEY, this.theme);
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
    }
    this.router.navigate(['/login']);
  }

  private loadTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const storedTheme = window.localStorage.getItem(AdminLayoutComponent.THEME_STORAGE_KEY);
    return storedTheme === 'dark' ? 'dark' : 'light';
  }
}
