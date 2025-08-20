// app.routes.ts

import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { SignupPageComponent } from './pages/signup-page/signup-page.component';
import { DashboardComponent } from './pages/home/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard'; // Ensure this is the corrected guard
import { ForgotPageComponent } from './pages/forgot-page/forgot-page.component';
import { MainPageComponent } from './pages/home/main-page/main-page.component';
import { CaseListComponent } from './pages/home/main-page/case-list/case-list.component';
import { SubscriptionsComponent } from './pages/subscriptions/subscriptions.component';
import { AccountSettingsComponent } from './pages/account-settings/account-settings.component';
import { ReportsComponent } from './pages/home/main-page/reports/reports.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUploadComponent } from './pages/admin-upload/admin-upload.component';
import { AimodelComponent } from './aimodel/aimodel.component';

export const routes: Routes = [
  // Public Routes (no guard needed)
  { path: '', component: LoginPageComponent },
  { path: 'sign-up', component: SignupPageComponent },
  { path: 'forgot-password', component: ForgotPageComponent },

  // Protected Routes (authGuard on the parent)
  {
    path: '',
    canActivate: [authGuard], // Guard applied here to protect all children
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'app-main-page', component: MainPageComponent },
      { path: 'case-list', component: CaseListComponent },
      { path: 'subscriptions', component: SubscriptionsComponent },
      { path: 'account-settings', component: AccountSettingsComponent },
      { path: 'app-reports', component: ReportsComponent },
      { path: 'ai', component: AimodelComponent },
    ],
  },

  // Admin Routes (can use a separate guard or just apply authGuard)
  {
    path: 'adminds',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin-upload',
    component: AdminUploadComponent,
    canActivate: [authGuard],
  },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },

  // Redirect any unknown paths back to the login page
  { path: '**', redirectTo: '' },
];
