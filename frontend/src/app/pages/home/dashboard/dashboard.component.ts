import { Component, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../../core/header/header.component';
import { FooterComponent } from '../../../core/footer/footer.component';
import { Observable } from 'rxjs';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { ExcelData } from '../../admin/excelDataTpes-interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButton,
    HeaderComponent,
    FooterComponent,
    RouterLink,
    CommonModule,
    JsonPipe,
    MatTableModule,
    // RouterOutlet
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  // items$: Observable<any[]> = []; // Initialize as an empty array
  // items$:any[]=[];
  excelData: any[] = [];
  displayedColumns: string[] = [
    'srNo',
    'caseDate',
    'closedDate',
    'fileName',
    'caseNumber',
    'court',
    'patentNo',
    'caseName',
    'industry',
    'category',
    'keywords',
    'techCentre',
    'status',
    'accusedProduct',
    'winningChancesPercent',
    'predefinedReport',
    'issuedDate',
    'expiryDate',
    'acquiredPatentOrOrganicPatent',
    'timeline',
    'numberOfDefendants',
    'otherDefendants',
    'thirdPartyFundingInvolved',
    'typeOfCase',
    'caseStrengthLevel',
    'singlePatentOrFamilyInvolved',
    'backwardCitation',
    'judge',
    'typeOfPatent',
    'plaintiffTypeAndSize',
    'defendantTypeAndSize',
    'originalAssignee',
    'currentAssignee',
    'assigneeTimeline',
    'recentAction',
    'winningAmount',
    'winningParty',
    'otherPossibleInfringer',
    'listOfPriorArt',
    'anySEP',
    'anySemiconductor',
    'causeOfAction',
    'artUnit',
    'reasonOfAllowance',
    'caseClosedDate',
    'plaintiffOrPetitioner',
    'defendant',
    'plaintiffsLawFirmName',
    'plaintiffAttorney',
    'plaintiffPhone',
    'plaintiffEmail',
    'defendantLawFirmName',
    'defendantAttorney',
    'defendantPhone',
    'defendantEmail',
    'relatedOriginatingCases',
    'assignedJudge',
    'jurisdiction',
    'source',
  ];

  constructor(private authService: AuthService, private router: Router) {}
  // this.authService.login(this.email, this.password).subscribe({
  //   next: (user) =>{
  //     console.log('Logged in as:', user?.email);
  //     this.router.navigate(['/dashboard']);
  //   },
  //   error: (error) => {
  //     this.incorrectPassword=!this.incorrectPassword;
  //     console.error('Login failed:', error)
  //   }
  // });

  ngOnInit() {
    // this.items$ = this.authService.fetchCollectionData('excelData');
    // this.authService.getData('excelData').subscribe((result) => {
    //   this.excelData = result;
    //   console.log("this is fetch data:-"+this.excelData); // Check the fetched data
    // });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['']);
      },
      error: (error) => console.error('Logout failed:', error),
    });
  }
  // getColumnKeys(): string[] {
  //   return this.excelData.length > 0 ? Object.keys(this.excelData[0]) : [];
  // }

  // getColumnKeys(): string[] {
  //   return Object.keys(ExcelData[0]); // This should return the keys like ['name', '']
  // }
}
