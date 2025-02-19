import { Component, inject, OnInit, signal } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [
    MatCheckboxModule,
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
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.scss',
})
export class SignupPageComponent implements OnInit {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  matchPassword: boolean = false;
  emailEnter: boolean = false;
  rememberMe: boolean = false;
  isChecked = false; // Default state of the checkbox
  hide = signal(true);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'] || null; // Retrieve email from query params
      console.log('Received email:', this.email);
    });
  }

  register(): void {
    if (this.password === this.confirmPassword) {
      this.authService.register({"email":this.email, "password":this.password}).subscribe({
        next: (user) => {
          console.log('Registered as:', user?.email);
          this.router.navigate(['/']);
        },
        error: (error) => console.error('Registration failed:', error),
      });
    } else {
      this.matchPassword = !this.matchPassword;
    }
  }

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  getInputType(): string {
    return this.hide() ? 'password' : 'text'; // Return 'password' or 'text' based on the state
  }

  checkPasswordMatch(): void {
    const partialPassword = this.password.substring(
      0,
      this.confirmPassword.length
    );
    this.matchPassword = partialPassword !== this.confirmPassword;
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
