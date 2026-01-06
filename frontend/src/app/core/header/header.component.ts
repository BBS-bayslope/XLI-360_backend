import { Component, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import { startWith } from 'rxjs/internal/operators/startWith';
import { map } from 'rxjs/internal/operators/map';
import { ReactiveFormsModule } from '@angular/forms'; // Import this
import { CommonModule } from '@angular/common'; // Add this
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { User } from '@angular/fire/auth';
import { ApiService } from '../../services/api.service';
import { LoginPageComponent } from '../../pages/login-page/login-page.component';
import { MatTooltipModule } from '@angular/material/tooltip';
// import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatTooltipModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatIcon,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    MatButton,
    MatSelectModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
  
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  searchControl = new FormControl();
  options: any[] = [];
  // This is your JSON data
  filteredOptions: Observable<any[]>;
  user: User | null = null;

  constructor(
    private dataService: AuthService,
    private api: ApiService,
    private router: Router,
    private authService: AuthService
  ) {
    this.filteredOptions = this.searchControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );
  }

  ngOnInit(): void {
    this.dataService.getUserState().subscribe((user) => {
      this.user = user;
    });
    // this.dataService.getData('excelData').subscribe((res) => {
    //   this.options = res;
    //   // console.log(res);
    //   this.filteredOptions = this.searchControl.valueChanges.pipe(
    //     startWith(''),
    //     map((value) => this._filter(value || ''))
    //   );
    // });
  }

  onLogoClick(): void {
    this.api.emitLogoClick();
  }

  private _filter(value: string): any[] {
    const filterValue = value.toLowerCase();

    return this.options.filter((option) => {
      const data = option.data || {}; // Access the data field safely

      return (
        (data.plaintiffAttorney?.toLowerCase() || '').includes(filterValue) ||
        (data.caseName?.toLowerCase() || '').includes(filterValue) ||
        (data.keywords?.toLowerCase() || '').includes(filterValue) ||
        (data.plaintiffEmail?.toLowerCase() || '').includes(filterValue) ||
        (data.defendant?.toLowerCase() || '').includes(filterValue) ||
        (data.category?.toLowerCase() || '').includes(filterValue) ||
        (data.plaintiffOrPetitioner?.toLowerCase() || '').includes(
          filterValue
        ) ||
        (data.patentNo?.toLowerCase() || '').includes(filterValue)
      );
    });
  }

  goToBuyer() {
    console.log('it is clicked');

    window.location.href = 'https://bas-3nw9.onrender.com';
  }
  goToSell() {
    window.location.href = 'https://bas-3nw9.onrender.com';
  }

  logout(): void {
    console.log('It is clicked and log out ');
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']).then(() => {
        // Prevent back button
        history.pushState(null, '', location.href);
        window.onpopstate = () => {
          history.go(1);
        };
      });
    });
  }
  goToBuyer1(): void {
    this.router.navigate(['/externaldata']);
    
  }
}
