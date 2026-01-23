import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Telecom Ticketing System';
  isHandset$: any;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUser(): any {
    return this.authService.currentUserValue;
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  get isStaff(): boolean {
    return this.authService.hasAnyRole(['AGENT', 'TECH', 'ADMIN']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
