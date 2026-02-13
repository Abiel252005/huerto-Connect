import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
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
    { label: 'Dashboard', icon: 'grid-outline', route: '/admin/dashboard' },
    { label: 'Usuarios', icon: 'people-outline', route: '/admin/usuarios' },
    { label: 'Huertos', icon: 'leaf-outline', route: '/admin/huertos' },
    { label: 'Cultivos', icon: 'flower-outline', route: '/admin/cultivos' },
    { label: 'Regiones y Ubicacion', icon: 'earth-outline', route: '/admin/regiones' },
    { label: 'Deteccion de Plagas (IA)', icon: 'bug-outline', route: '/admin/plagas' },
    { label: 'Chatbot IA', icon: 'chatbubbles-outline', route: '/admin/chatbot' },
    { label: 'Recomendaciones', icon: 'bulb-outline', route: '/admin/recomendaciones' },
    { label: 'Alertas', icon: 'alert-circle-outline', route: '/admin/alertas' },
    { label: 'Estadisticas', icon: 'stats-chart-outline', route: '/admin/estadisticas' },
    { label: 'Reportes', icon: 'document-text-outline', route: '/admin/reportes' },
    { label: 'Integraciones', icon: 'link-outline', route: '/admin/integraciones' },
    { label: 'Configuracion', icon: 'settings-outline', route: '/admin/configuracion' },
    { label: 'Auditoria', icon: 'shield-checkmark-outline', route: '/admin/auditoria' }
  ];

  statuses = [
    'AI Engine Online',
    'Chatbot Active',
    'Detection System Running',
    'Data Pipeline Active'
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
      return 'dark';
    }

    const storedTheme = window.localStorage.getItem(AdminLayoutComponent.THEME_STORAGE_KEY);
    return storedTheme === 'light' ? 'light' : 'dark';
  }
}
