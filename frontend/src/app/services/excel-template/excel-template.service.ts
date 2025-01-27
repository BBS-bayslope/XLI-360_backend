import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class ExcelTemplateService {
  private readonly MAX_PLAINTIFFS = 1; // Maximum number of plaintiff attorneys
  private readonly MAX_DEFENDANTS = 1; // Maximum number of defendant attorneys

  private readonly orderedHeaders: string[] = [
    'Case Complaint Date',
    'Case Number',
    'Case Name',
    'Tech Category',
    'Court Names',
    'Quick Search Report',
    'Status',
    'Litigation Venues & Judicial Authorities',
    'Related/Originating Cases',
    'Case Closed Date',
    'Patent No',
    'Industry',
    'Technology Keywords',
    'Tech Centre',
    'Accused Product',
    'Chances of Winning',
    'Patent Issued Date',
    'Patent Expiry Date',
    'Acquired Patent or Organic patent?',
    'Activity Timeline',
    'Number of Infringed Claims',
    'Number of Defendants',
    'Other Defendants',
    '3rd Party Funding Involved',
    'Type of Infringement',
    'Case Strength Level',
    'Single Patent or Family Involved?',
    'Backward Citation',
    'Forward Citation',
    'Judge',
    'Type of Patent',
    'Plaintiff Type & Size',
    'Defendant Type & Size',
    'Original Assignee',
    'Current Assignee',
    'Assignee Timeline',
    'Recent Action',
    'Winning Amount',
    'Winning Party',
    'Other Possible Infringer',
    'List of Prior Art',
    'Standard Essential Patent',
    'Semiconductor Patent',
    'Cause of Action',
    'Art Unit',
    'Reason of Allowance',
    'Plaintiff/Petitioner',
    "Plaintiff's Law Firm Name",
    'PA Name 1',
    'PA Phone 1',
    'PA Email 1',
    'Defendant',
    'Defendant Law Firm Name',
    'DA Name 1',
    'DA Phone 1',
    'DA Email 1',
    'Assigned Judge',
    'Stage',
  ];

  private generateDynamicPlaintiffHeaders(): string[] {
    const headers: string[] = [];
    for (let i = 1; i <= this.MAX_PLAINTIFFS; i++) {
      headers.push(`PA Name ${i}`, `PA Phone ${i}`, `PA Email ${i}`);
    }
    return headers;
  }

  private generateDynamicDefendantHeaders(): string[] {
    const headers: string[] = [];
    for (let i = 1; i <= this.MAX_DEFENDANTS; i++) {
      headers.push(`DA Name ${i}`, `DA Phone ${i}`, `DA Email ${i}`);
    }
    return headers;
  }

  exportExcel() {
    const allHeaders = [
      ...this.orderedHeaders.slice(0, this.orderedHeaders.indexOf('PA Name 1')),
      ...this.generateDynamicPlaintiffHeaders(),
      ...this.orderedHeaders.slice(
        this.orderedHeaders.indexOf('Defendant'),
        this.orderedHeaders.indexOf('DA Name 1')
      ),
      ...this.generateDynamicDefendantHeaders(),
      ...this.orderedHeaders.slice(
        this.orderedHeaders.indexOf('Assigned Judge')
      ),
    ];

    // Create the worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([], {
      header: allHeaders,
    });

    // Adjust column width for better readability
    worksheet['!cols'] = allHeaders.map(() => ({ wch: 25 })); // Set column width to 25

    // Create the workbook and append the worksheet
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Write the Excel file
    XLSX.writeFile(workbook, 'Template.xlsx');
  }
}

// import { Injectable } from '@angular/core';
// import * as XLSX from 'xlsx';

// @Injectable({
//   providedIn: 'root',
// })
// export class ExcelTemplateService {
//   private readonly headerMapping: { [key: string]: string } = {

//     caseComplaintDate: 'Case Complaint Date',
//     caseNumber: 'Case Number',
//     caseName: 'Case Name',
//     techCategory: 'Tech Category',
//     courtNames: 'Court Names',
//     quickSearchReport: 'Quick Search Report',
//     status: 'Status',
//     litigationVenues: 'Litigation Venues & Judicial Authorities',
//     relatedOriginatingCases: 'Related/Originating Cases',
//     caseClosedDate: 'Case Closed Date',
//     patentNo: 'Patent No',
//     industry: 'Industry',
//     technologyKeywords: 'Technology Keywords',
//     techCentre: 'Tech Centre',
//     accusedProduct: 'Accused Product',
//     chancesOfWinning: 'Chances of Winning',
//     patentIssuedDate: 'Patent Issued Date',
//     patentExpiryDate: 'Patent Expiry Date',
//     acquiredPatentOrOrganicPatent: 'Acquired Patent or Organic patent?',
//     activityTimeline: 'Activity Timeline',
//     numberOfInfringedClaims: 'Number of Infringed Claims',
//     numberOfDefendants: 'Number of Defendants',
//     otherDefendants: 'Other Defendants',
//     thirdPartyFundingInvolved: '3rd Funding Involved',
//     typeOfInfringement: 'Type of Infringement',
//     caseStrengthLevel: 'Case Strength Level',
//     singlePatentOrFamilyInvolved: 'Single Patent or Family Involved?',
//     backwardCitation: 'Backward Citation',
//     forwardCitation: 'Forward Citation',
//     judge: 'Judge',
//     typeOfPatent: 'Type of Patent',
//     plaintiffTypeAndSize: 'Plaintiff Type & Size',
//     defendantTypeAndSize: 'Defendant Type & Size',
//     originalAssignee: 'Original Assignee',
//     currentAssignee: 'Current Assignee',
//     assigneeTimeline: 'Assignee Timeline',
//     recentAction: 'Recent Action',
//     winningAmount: 'Winning Amount',
//     winningParty: 'Winning Party',
//     otherPossibleInfringer: 'Other Possible Infringer',
//     listOfPriorArt: 'List of Prior Art',
//     standardEssentialPatent: 'Standard Essential Patent',
//     semiconductorPatent: 'Semiconductor Patent',
//     causeOfAction: 'Cause of Action',
//     artUnit: 'Art Unit',
//     reasonOfAllowance: 'Reason of Allowance',
//     plaintiffOrPetitioner: 'Plaintiff/Petitioner',
//     plaintiffsCompanyName: 'Plaintiff\'s Company Name',
//     plaintiffsName: 'Name',
//     plaintiffsPhone: 'Phone',
//     plaintiffsEmail: 'Email',
//     defendant: 'Defendant',
//     defendantLawFirmName: 'Defendant Law Firm Name',
//     defendantAttorney: 'Attorney',
//     defendantPhone: 'Phone',
//     defendantEmail: 'Email',
//     assignedJudge: 'Assigned Judge',
//     stage: 'Stage',
//    };

//   exportExcel() {
//     const headers: { [key: string]: any }[] = [{}];
//     const headerKeys = Object.keys(this.headerMapping);
//     const displayHeaders = headerKeys.map(key => this.headerMapping[key]);
//     const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(headers, { header: displayHeaders });
//     const workbook: XLSX.WorkBook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
//     XLSX.writeFile(workbook, 'Template.xlsx');
//   }
// }
