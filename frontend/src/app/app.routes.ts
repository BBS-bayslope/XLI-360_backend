import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { SignupPageComponent } from './pages/signup-page/signup-page.component';
import { DashboardComponent } from './pages/home/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { ForgotPageComponent } from './pages/forgot-page/forgot-page.component';
import { AdminComponent } from './pages/admin/admin.component';
// import { MainPageComponent } from './pages/home/main-page/main-page.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
// import { CaseListComponent } from './pages/home/main-page/case-list/case-list.component';
import { SubscriptionsComponent } from './pages/subscriptions/subscriptions.component';
import { AccountSettingsComponent } from './pages/account-settings/account-settings.component';
import { MainPageComponent } from './pages/home/main-page/main-page.component';
import { CaseListComponent } from './pages/home/main-page/case-list/case-list.component';
import { ReportsComponent } from './pages/home/main-page/reports/reports.component';
import { AdminUploadComponent } from './pages/admin-upload/admin-upload.component';
import { AimodelComponent } from './aimodel/aimodel.component';

export const routes: Routes = [
  {
    path: 'adminds',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
  },
  { path: 'admin', component: AdminComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    
  },

  { path: 'login', component: LoginPageComponent },
  { path: 'sign-up', component: SignupPageComponent },
  { path: 'forgot-password', component: ForgotPageComponent },

  { path: '', component: MainPageComponent  },
  { path: 'case-list', component: CaseListComponent },
  {
    path: 'subscriptions',
    component: SubscriptionsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'account-settings',
    component: AccountSettingsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'app-reports',
    component: ReportsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin-upload',
    component: AdminUploadComponent,
    canActivate: [authGuard],
  },
  { path: 'ai', component: AimodelComponent, canActivate: [authGuard] },

  // optional redirect
  // { path: '**', redirectTo: 'login' },
];

