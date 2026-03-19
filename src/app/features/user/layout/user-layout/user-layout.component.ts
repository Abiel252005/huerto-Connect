import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, UserRole } from '../../../../core/auth/services/auth.service';
import { getRoleLabel } from '../../../../core/auth/auth-role.utils';

interface UserNavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser$ = this.authService.currentUser$;
  readonly defaultAvatar = 'assets/images/default-avatar.svg';

  readonly navItems: UserNavItem[] = [
    { label: 'Dashboard personal', icon: 'grid-outline', route: '/user/dashboard' }
  ];

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.authService.getMe().subscribe({
      error: () => {
        // Ignore transient errors and keep current session data.
      }
    });
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

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
