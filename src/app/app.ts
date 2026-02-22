import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd, NavigationStart } from '@angular/router';
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
export class AppComponent implements OnInit {
  title = 'huerto-connect';
  showSplash = true;
  showChrome = true; // Controls header + footer visibility
  isDashboard = false;
  private isInitialLoad = true;
  private previousUrl = '';

  constructor(private readonly router: Router) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const url = event.urlAfterRedirects || event.url;
      this.showChrome = !url.startsWith('/login') && !url.startsWith('/admin');
      this.isDashboard = url.startsWith('/admin');

      // If we are navigating to admin FROM login, show splash again
      if (this.isDashboard && this.previousUrl.startsWith('/login') && !this.isInitialLoad) {
        this.showSplash = true;
        // The dashboard CSS handles the background color, we just reset inline style
        document.body.style.backgroundColor = '';
      }

      this.previousUrl = url;
      this.isInitialLoad = false;
    });
  }

  ngOnInit() {
    // Fallback if NavigationEnd takes time
  }

  onSplashComplete(): void {
    this.showSplash = false;

    // Smoothly transition body from dark splash color to page background
    document.body.style.transition = 'background-color 1.5s ease';
    document.body.style.backgroundColor = this.isDashboard ? '' : '#F9F9F9';
  }
}
