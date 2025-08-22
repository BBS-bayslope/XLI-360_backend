import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AboutComponent } from '../about/about.component';
import { Header1Component } from '../header1/header1.component';
import { ContactComponent } from '../contact/contact.component';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
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
    AboutComponent,Header1Component,ContactComponent
  ],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})
export class HomepageComponent {

  login(){

  }
}
