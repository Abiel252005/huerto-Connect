import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  HostListener,
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

type NotificationLevel = 'critical' | 'warning' | 'success' | 'info';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  level: NotificationLevel;
  createdAt: number;
  read: boolean;
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
  notificationsOpen = false;

  notifications: NotificationItem[] = [
    {
      id: 'n-01',
      title: 'Umbral IA superado',
      message: 'Pulgón verde en Xalapa con 93% de confianza.',
      level: 'critical',
      createdAt: Date.now() - 1000 * 60 * 6,
      read: false
    },
    {
      id: 'n-02',
      title: 'Sensor sin reporte',
      message: 'Nodo HRT-07 no envía telemetría desde hace 18 minutos.',
      level: 'warning',
      createdAt: Date.now() - 1000 * 60 * 18,
      read: false
    },
    {
      id: 'n-03',
      title: 'Región sincronizada',
      message: 'Región Córdoba actualizada con 12 huertos activos.',
      level: 'success',
      createdAt: Date.now() - 1000 * 60 * 42,
      read: true
    },
    {
      id: 'n-04',
      title: 'Modelo IA estable',
      message: 'Versión v2.7.3 validada con deriva dentro de parámetros.',
      level: 'info',
      createdAt: Date.now() - 1000 * 60 * 95,
      read: true
    }
  ];

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

  get unreadCount(): number {
    return this.notifications.filter((item) => !item.read).length;
  }

  get hasUnread(): boolean {
    return this.unreadCount > 0;
  }

  get hasNotifications(): boolean {
    return this.notifications.length > 0;
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AdminLayoutComponent.THEME_STORAGE_KEY, this.theme);
    }
  }

  toggleNotifications(event?: Event) {
    event?.stopPropagation();
    this.notificationsOpen = !this.notificationsOpen;
  }

  closeNotifications() {
    this.notificationsOpen = false;
  }

  markAsRead(notificationId: string, event?: Event) {
    event?.stopPropagation();
    this.notifications = this.notifications.map((item) =>
      item.id === notificationId ? { ...item, read: true } : item
    );
  }

  dismissNotification(notificationId: string, event?: Event) {
    event?.stopPropagation();
    this.notifications = this.notifications.filter((item) => item.id !== notificationId);
  }

  markAllAsRead(event?: Event) {
    event?.stopPropagation();
    this.notifications = this.notifications.map((item) => ({ ...item, read: true }));
  }

  clearAll(event?: Event) {
    event?.stopPropagation();
    this.notifications = [];
  }

  notificationIcon(level: NotificationLevel): string {
    switch (level) {
      case 'critical':
        return 'alert-circle-outline';
      case 'warning':
        return 'warning-outline';
      case 'success':
        return 'checkmark-circle-outline';
      default:
        return 'information-circle-outline';
    }
  }

  relativeTime(createdAt: number): string {
    const diffMs = Date.now() - createdAt;
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMin < 60) {
      return `Hace ${diffMin} min`;
    }

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  }

  logout() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
    }
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.notificationsOpen) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const clickedInside = Boolean(target?.closest('.notifications-shell'));
    if (!clickedInside) {
      this.closeNotifications();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeNotifications();
  }

  private loadTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const storedTheme = window.localStorage.getItem(AdminLayoutComponent.THEME_STORAGE_KEY);
    return storedTheme === 'dark' ? 'dark' : 'light';
  }
}
