import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getCurrentUser().pipe(
    take(1), // ✅ Important: Only take the first value
    map(user => {
      if (user) {
        return true;
      } else {
        router.navigate(['/']);
        return false;
      }
    })
  );
};
