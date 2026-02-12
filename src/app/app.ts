import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { SplashScreenComponent } from './core/components/splash-screen/splash-screen.component';

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

  onSplashComplete(): void {
    this.showSplash = false;

    // Smoothly transition body from dark splash color to page background
    document.body.style.transition = 'background-color 1.5s ease';
    document.body.style.backgroundColor = '#F9F9F9';
  }
}
