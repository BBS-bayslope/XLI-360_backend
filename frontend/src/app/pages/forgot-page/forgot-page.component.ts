import { Component, inject, ViewEncapsulation } from '@angular/core';
// import { AuthService } from '../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-forget-page',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatTabsModule,
    FormsModule,
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    RouterLink,
  ],
  templateUrl: './forgot-page.component.html',
  styleUrl: './forgot-page.component.scss',
})
export class ForgotPageComponent {
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  message: string = '';
  constructor(private authService: AuthService) {}

  resetPassword(email: string): void {
    this.authService.forgotPassword(email).subscribe({
      next: () => console.log('Password reset email sent'),
      error: (error) => console.error('Reset failed:', error),
    });
  }
}
