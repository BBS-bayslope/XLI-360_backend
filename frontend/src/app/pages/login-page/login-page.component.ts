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
import { ApiService } from '../../services/api.service';
import { MainPageComponent } from '../home/main-page/main-page.component';
import { log } from 'console';
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    MainPageComponent,
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

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  // login(): void {

  //   this.incorrectPassword = false;
  //   this.authService.login({"email":this.email, "password":this.password}).subscribe({
  //     next: (user) => {
  //       console.log('Logged in as:', user?.email);
  //       alert("Log in Successfull")
  //       this.router.navigate(['/main']);
  //     },
  //     error: (error) => {
  //       this.incorrectPassword = !this.incorrectPassword;
  //       console.error('Login failed:', error);
  //     },
  //   });
  // }

  login(): void {
    this.incorrectPassword = false;

    this.authService
      .login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          if (response && response.access) {
             localStorage.setItem('access', response.access);
             this.authService.setCurrentUser(
               response.user || { email: this.email, access: response.access }
             );
            //  this.router.navigate(['/app-main-page']);
            this.router.navigate(['/app-main-page']);
            console.log("it is logged in");
          } else {
            // This block handles cases where the API returns a 200 but no token.
            this.incorrectPassword = true;
            console.error('Login failed: Token not found in response.');
          }
        },
        error: (error) => {
          this.incorrectPassword = true;
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
        this.router.navigate(['/app-main-page']);
      },
      error: (error) => console.error('Google login failed:', error),
    });
  }
}
