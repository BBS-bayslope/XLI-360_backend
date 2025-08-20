import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if we have a valid JWT token in localStorage
  const token = localStorage.getItem('access');
  
  if (token) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};
