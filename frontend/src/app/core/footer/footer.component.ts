import { Component, inject } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarModule,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import {
  BrowserAnimationsModule,
  NoopAnimationsModule,
} from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    MatToolbar,
    // MatIcon,
    MatIconModule,

    MatSnackBarModule,
    // MatButtonModule,
    // CommonModule,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  constructor(private snackBar: MatSnackBar) {}

  openSnackBar() {
    this.snackBar.open('Coming soon!', 'Close', {
      duration: 1000, // Duration in milliseconds
      horizontalPosition: 'center', // Center the snackbar horizontally
      verticalPosition: 'top', // Position at the top
    });
  }

  // private _snackBar = inject(MatSnackBar);

  // horizontalPosition: MatSnackBarHorizontalPosition = 'start';
  // verticalPosition: MatSnackBarVerticalPosition = 'bottom';

  // openSnackBar() {
  //   this._snackBar.open('Cannonball!!', 'Splash', {
  //     horizontalPosition: this.horizontalPosition,
  //     verticalPosition: this.verticalPosition,
  //   });
  // }
}
