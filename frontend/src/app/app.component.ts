import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/header/header.component';
import { FooterComponent } from './core/footer/footer.component';
import { AuthService, FirestoreData } from './services/auth.service';
import { HomepageComponent } from './homepage/homepage.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    HeaderComponent,
    FooterComponent,
    HomepageComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'litigation99';
  showHeaderFooter: boolean = true;

  hiddenPaths: string[] = ['/','/login', '/sign-up', '/forgot-password', '/homepage','/about','/contact','/header'];

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      history.pushState(null, '', window.location.href);
    };
    // Subscribe to route changes
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.toggleHeaderFooter(event.urlAfterRedirects);
      }
    });

    console.log('App initialized. IndexedDB service is ready.');

    // Existing AuthService functionality
    this.auth.getCurrentUser().subscribe((res) => {
      console.log(res);
    });
  }

  // Function to toggle visibility of header and footer
  toggleHeaderFooter(url: string): void {
    const path = url.split('?')[0]; // Ignore query parameters
    this.showHeaderFooter = !this.hiddenPaths.includes(path);
  }
}
