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

export const routes: Routes = [
  { path: 'adminds', component: AdminDashboardComponent },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent },
  // {path:'excel-sheet',    loadChildren: () => import('./excel-sheet/excel-sheet.component').then(c => c.ExcelSheetComponent)},
  // {path:'admin',loadChildren:()=>import('./pages/admin/admin.component').then(c=>c.AdminComponent), canActivate:[authGuard]},
  // {path:'dashboard', loadChildren:()=>import('./pages/home/dashboard/dashboard.component').then(c=>c.DashboardComponent), canActivate:[authGuard],
  //     // children:[
  //     //     {path:'admin',component:AdminComponent}
  //     // ]
  // },
  { path: 'login', component: LoginPageComponent },
  { path: 'sign-up', component: SignupPageComponent },
  { path: 'forgot-password', component: ForgotPageComponent },
  // {path:'',redirectTo:'login', pathMatch:'full'},
  { path: '', component: MainPageComponent, children: [] },
  { path: 'case-list', component: CaseListComponent },
  { path: 'subscriptions', component: SubscriptionsComponent },
  {
    path: 'account-settings',
    component: AccountSettingsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'app-reports',
    component: ReportsComponent,
  },
  // {path:'caseDetails/:docId', component:CaseListComponent},
  // {path:'',redirectTo:'main-page', pathMatch:'full'},

  // { path: '', redirectTo: 'main-page', pathMatch: 'full' },
  // { path: '', redirectTo: 'login', pathMatch: 'full' },
  // {path:'',redirectTo:'login'}
  { path: 'admin-upload', component: AdminUploadComponent },
];
