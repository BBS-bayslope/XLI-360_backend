import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(
    map(user => {
      if (user) {
        return true; // User is authenticated
      } else {
        router.navigate(['/login']); // Redirect to login if not authenticated
        return false;
      }
    })
  );
};