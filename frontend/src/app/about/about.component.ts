import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HomepageComponent } from '../homepage/homepage.component';
import { ContactComponent } from '../contact/contact.component';
import { Header1Component } from "../header1/header1.component";

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, HomepageComponent, ContactComponent, Header1Component,Header1Component],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {

}
