import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
// import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatTabsModule,
    FormsModule,
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  email: string = '';
  password: string = '';
  isContinueVisible: boolean = true;
  isPasswordVisible: boolean = false;
  incorrectPassword: boolean = false;
  hide = signal(true);

  constructor(private authService: AuthService, private router: Router) {}

  login(): void {
    this.incorrectPassword = false;
    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        console.log('Logged in as:', user?.email);
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.incorrectPassword = !this.incorrectPassword;
        console.error('Login failed:', error);
      },
    });
  }

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  navigateToSignUp(email: string): void {
    this.router.navigate(['/sign-up'], { queryParams: { email } });
  }

  onContinue() {
    console.log(this.email);
    this.isContinueVisible = !this.isContinueVisible;
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  googleLogin(): void {
    this.authService.googleLogin().subscribe({
      next: (user) => {
        console.log('Google login successful:', user?.email);
        this.router.navigate(['/']);
      },
      error: (error) => console.error('Google login failed:', error),
    });
  }
}
