import { Component } from '@angular/core';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';
import { LoginPageComponent } from '../pages/login-page/login-page.component';
// import { CommonEngine } from '@angular/ssr';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header1',
  standalone: true,
  imports: [AboutComponent,ContactComponent,LoginPageComponent,CommonModule,RouterLink,RouterModule],
  templateUrl: './header1.component.html',
  styleUrl: './header1.component.scss'
})
export class Header1Component {

}
