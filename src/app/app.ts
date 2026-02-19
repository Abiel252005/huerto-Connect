import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { SplashScreenComponent } from './core/components/splash-screen/splash-screen.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, SplashScreenComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'huerto-connect';
  showSplash = true;
  showChrome = true; // Controls header + footer visibility

  constructor(private readonly router: Router) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      // Hide header/footer on login and admin routes
      const url = event.urlAfterRedirects || event.url;
      this.showChrome = !url.startsWith('/login') && !url.startsWith('/admin');
    });
  }

  onSplashComplete(): void {
    this.showSplash = false;

    // Smoothly transition body from dark splash color to page background
    document.body.style.transition = 'background-color 1.5s ease';
    document.body.style.backgroundColor = '#F9F9F9';
  }
}
