import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { environment } from './environments/environment';
import { getStorage, provideStorage } from '@angular/fire/storage';  // Import for Storage
import { provideFirestore, getFirestore } from '@angular/fire/firestore';  // Ensure this import is here
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async'
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient, HttpClientModule } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
    provideCharts(withDefaultRegisterables()),
    // BrowserAnimationsModule, // Import animations module
    provideAnimationsAsync(),
     provideRouter(routes), 
     provideClientHydration(), 
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    //  provideFirebaseApp(() => {
    //   const app = initializeApp(environment.firebaseConfig);
    //   // console.log('Firebase initialized:', app.name); // Confirmation log
    //   return app;
    // }),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),  // Provides Firestore
    provideStorage(() => getStorage()), provideCharts(withDefaultRegisterables()),
    provideHttpClient(),

    ]
};
  