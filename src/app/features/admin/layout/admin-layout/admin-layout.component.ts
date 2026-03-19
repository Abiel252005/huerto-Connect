import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastNotificationComponent } from '../../components/toast-notification/toast-notification.component';
import { getRoleLabel } from '../../../../core/auth/auth-role.utils';
import { AuthService, UserRole } from '../../../../core/auth/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  accent: string;
  accentLight: string;
  roles: UserRole[];
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
export class AdminLayoutComponent implements OnInit {
  private static readonly THEME_STORAGE_KEY = 'huerto-admin-theme';
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly currentUser$ = this.authService.currentUser$;
  readonly defaultAvatar = 'assets/images/default-avatar.svg';

  theme: 'dark' | 'light' = this.loadTheme();

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'grid-outline',
      route: '/admin/dashboard',
      accent: '#00f7ff',
      accentLight: '#0f6c77',
      roles: ['admin', 'manager']
    },
    {
      label: 'Usuarios',
      icon: 'people-outline',
      route: '/admin/usuarios',
      accent: '#2d8bff',
      accentLight: '#1e5e9d',
      roles: ['admin']
    },
    {
      label: 'Huertos',
      icon: 'leaf-outline',
      route: '/admin/huertos',
      accent: '#00ffa3',
      accentLight: '#0a8e5f',
      roles: ['admin', 'manager']
    },
    {
      label: 'Regiones y Ubicacion',
      icon: 'earth-outline',
      route: '/admin/regiones',
      accent: '#8f7bff',
      accentLight: '#5f4fb8',
      roles: ['admin', 'manager']
    },
    {
      label: 'Deteccion de Plagas (IA)',
      icon: 'bug-outline',
      route: '/admin/plagas',
      accent: '#22e48e',
      accentLight: '#0f8a54',
      roles: ['admin']
    },
    {
      label: 'Chatbot IA',
      icon: 'chatbubbles-outline',
      route: '/admin/chatbot',
      accent: '#3cd1ff',
      accentLight: '#1474a7',
      roles: ['admin']
    },
    {
      label: 'Estadisticas',
      icon: 'stats-chart-outline',
      route: '/admin/estadisticas',
      accent: '#ffc857',
      accentLight: '#9a7112',
      roles: ['admin', 'manager']
    },
    {
      label: 'Reportes',
      icon: 'document-text-outline',
      route: '/admin/reportes',
      accent: '#5ef2d6',
      accentLight: '#0e7f68',
      roles: ['admin', 'manager']
    }
  ];

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.authService.getMe().subscribe({
      error: () => {
        // Keep current session data when /me fails temporarily.
      }
    });
  }

  get isAdmin(): boolean {
    return this.authService.getUserRole() === 'admin';
  }

  get visibleNavItems(): NavItem[] {
    const role = this.authService.getUserRole();
    if (!role) {
      return [];
    }
    return this.navItems.filter((item) => item.roles.includes(role));
  }

  getRoleName(role: UserRole | null | undefined): string {
    return getRoleLabel(role);
  }

  onAvatarError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (!target || target.src.endsWith(this.defaultAvatar)) {
      return;
    }

    target.src = this.defaultAvatar;
  }

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
    this.authService.logout();
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
