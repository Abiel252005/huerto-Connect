
// Import IonIcons as stand-alone elements or directives if needed, or rely on script tags in index.html
// In Angular, usually we add script tags in index.html or angular.json
// For this snippet, we will assume generic icons or standard SVGs to avoid dependency hell if IonIcons isn't installed.
// However, the user provided IonIcons HTML. I will keep the structure but might need to ensure IonIcons is loaded in index.html.

import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent {
  isRegister = false;

  // Login Data
  loginEmail = '';
  loginPassword = '';

  // Register Data
  registerName = '';
  registerEmail = '';
  registerPassword = '';

  toggleMode() {
    this.isRegister = !this.isRegister;
  }

  onLogin() {
    console.log('Login:', this.loginEmail);
  }

  onRegister() {
    console.log('Register:', this.registerName, this.registerEmail);
  }
}
