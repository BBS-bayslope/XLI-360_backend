import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { HomepageComponent } from '../homepage/homepage.component';
import { CommonModule } from '@angular/common';
import { AboutComponent } from '../about/about.component';
import { FormsModule } from '@angular/forms';
import { Header1Component } from '../header1/header1.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [MatMenuModule,MatIconModule,MatButtonModule,HomepageComponent,CommonModule,AboutComponent,FormsModule,Header1Component],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {

constructor(private router :Router){}

  contactUs(){
    this.router.navigateByUrl('contact-us');
  }
  
  aboutUs(){
    this.router.navigateByUrl('about-us');
  }
  homePage(){
    this.router.navigateByUrl('/');
  }
  loginAdmin(){
    this.router.navigateByUrl('login')
  }
 

}
