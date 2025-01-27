import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import * as XLSX from 'xlsx';
import {
  ExcelData,
  UploadedFile,
  ContactPerson,
} from './excelDataTpes-interface';
import { AuthService } from '../../services/auth.service';
import { ExcelTemplateService } from '../../services/excel-template/excel-template.service';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Timestamp } from 'firebase/firestore';
import { MatButtonModule } from '@angular/material/button';
import { ManageReportsComponent } from '../../dialogs/manage-reports/manage-reports.component';
import { MatDialog } from '@angular/material/dialog';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  selectedFile: File | null = null; // For file input
  selectedTbFiles: File[] = []; // Temporary file selection for uploads
  excelData: ExcelData[] = []; // Stores validated Excel data
  validationErrors: string[] = []; // Stores validation errors
  submitted: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef;

  private authService = inject(AuthService);
  private api = inject(ApiService);
  private excelTemplateService = inject(ExcelTemplateService);
  displayedColumns: string[] = [
    'refID',
    'caseComplaintDate',
    'caseNumber',
    'caseName',
    'quickSearchReport',
    'status',
    'litigationVenues',
    'relatedOriginatingCases',
    'caseClosedDate',
    'patentNo',
    'techCategory',
    'technologyKeywords',
    'techCentre',
    'accusedProduct',
    'chancesOfWinning',
    'patentIssuedDate',
    'patentExpiryDate',
    'acquiredPatentOrOrganicPatent',
    'activityTimeline',
    'numberOfInfringedClaims',
    'numberOfDefendants',
    'otherDefendants',
    'thirdPartyFundingInvolved',
    'typeOfInfringement',
    'caseStrengthLevel',
    'singlePatentOrFamilyInvolved',
    'backwardCitation',
    'forwardCitation',
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
    'standardEssentialPatent',
    'semiconductorPatent',
    'causeOfAction',
    'artUnit',
    'reasonOfAllowance',
    'plaintiffOrPetitioner',
    'plaintiffsLawFirmName',
    'plaintiffPersons',
    'defendant',
    'defendantLawFirmName',
    'defendantPersons',
    'industry',
    'assignedJudge',
    'stage',
  ];

  currentUserId: string = ''; // To store the current user's ID
  startTime!: number;

  caseNumber: string = ''; // Bind this to the input field
  searchResult: { collectionName: string; data: any } | null = null; // To display the search result
  searchError: string | null = null; // To display errors

  constructor(private cdr: ChangeDetectorRef, private dialog: MatDialog) {}

  ngOnInit(): void {
    // Fetching current user ID from AuthService
    this.authService.getCurrentUser().subscribe((user) => {
      this.currentUserId = user?.uid || '';
    });

    this.api.fetchAllData().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          // Ensure `convertTimestampsToDates` works correctly
          this.excelData = data.map((item) =>
            this.convertTimestampsToDates(item)
          );

          console.log('Processed Data:', this.excelData);
        } else {
          console.error('Fetched data is not an array:', data);
          this.excelData = [];
        }
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.excelData = [];
      },
    });
  }

  searchByCaseNumber(): void {
    this.searchError = null; // Clear previous errors
    this.searchResult = null; // Clear previous results

    if (!this.caseNumber.trim()) {
      this.searchError = 'Case number is required.';
      return;
    }

    this.api.getDocsByCaseNumber(this.caseNumber).subscribe(
      (results) => {
        if (results && results.length > 0) {
          // Convert Timestamps to Dates for all documents
          this.excelData = results.map((doc) =>
            this.convertTimestampsToDates(doc)
          );
        } else {
          this.searchError = 'No documents found with the given case number.';
          this.excelData = []; // Clear table if no results are found
        }
      },
      (error) => {
        console.error('Error searching for case number:', error);
        this.searchError = 'An error occurred while searching.';
        this.excelData = []; // Clear table in case of an error
      }
    );
  }

  openManageReportsDialog(rowId: string, collectionName: string): void {
    this.dialog.open(ManageReportsComponent, {
      width: '800px',
      data: { rowId, collectionName },
    });
  }

  convertTimestampsToDates(item: any): any {
    // Traverse all keys in the object and convert Firestore Timestamps to JavaScript Dates
    for (const key in item) {
      if (item.hasOwnProperty(key)) {
        if (
          item[key]?.seconds !== undefined &&
          item[key]?.nanoseconds !== undefined
        ) {
          // Convert Firestore Timestamp to JavaScript Date
          item[key] = new Date(item[key].seconds * 1000);
        } else if (typeof item[key] === 'object' && item[key] !== null) {
          // Recursively process nested objects
          item[key] = this.convertTimestampsToDates(item[key]);
        }
      }
    }
    return item;
  }

  onFileChange(event: any): void {
    this.validationErrors = [];
    this.excelData = [];
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const binaryData = e.target.result;
      const workbook = XLSX.read(binaryData, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers: any = data[0]; // First row is the headers
      const rows = data.slice(1); // Remaining rows are the data

      rows.forEach((row: any, rowIndex) => {
        const rowObject = headers.reduce(
          (acc: any, header: any, index: any) => {
            acc[header] = row[index] || null; // Map headers to row values
            return acc;
          },
          {} as Record<string, any>
        );

        const validatedRow = this.validateRow(rowObject, rowIndex + 2); // Pass row object to validateRow
        if (validatedRow) this.excelData.push(validatedRow);
      });
      console.log('Validated Excel Data:', this.excelData);
      // console.log('Validation Errors:', this.validationErrors);
    };

    reader.readAsBinaryString(file);
  }

  // Class-level counters for cumulative totals
  totalOver50PercentFilled = 0;
  totalHighFilled = 0;
  totalMediumFilled = 0;
  totalLowFilled = 0;

  // Data arrays for categorized rows
  over50PercentData: any[] = [];
  highData: any[] = [];
  mediumData: any[] = [];
  lowData: any[] = [];
  finalMergedObject: any[] = [];

  // To store ranges of columns filled
  ranges = {
    over50Percent: { min: Infinity, max: -Infinity },
    high: { min: Infinity, max: -Infinity },
    medium: { min: Infinity, max: -Infinity },
    low: { min: Infinity, max: -Infinity },
  };

  // onFileChange2(event: any): void {
  //   const startTime = Date.now(); // Overall start time
  //   this.startTime = startTime;
  //   let processedChunks = 0;

  //   this.validationErrors = [];
  //   this.over50PercentData = [];
  //   this.highData = [];
  //   this.mediumData = [];
  //   this.lowData = [];
  //   this.finalMergedObject = [];

  //   const file = event.target.files[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = (e: any) => {
  //     try {
  //       console.log(
  //         `Excel will be imported by utility now..Time taken till here: ${
  //           (Date.now() - startTime) / 1000
  //         } seconds`
  //       );
  //       const binaryData = e.target.result;
  //       const workbook = XLSX.read(binaryData, { type: 'binary' });
  //       const sheetName = workbook.SheetNames[0];
  //       const sheet = workbook.Sheets[sheetName];
  //       const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  //       const headers: any = data[0];
  //       console.log(
  //         `Rows will be created now..Time taken till here: ${
  //           (Date.now() - startTime) / 1000
  //         } seconds`
  //       );
  //       const rows = data.slice(1, 2000);
  //       console.log(
  //         `Rows Generated. Time taken: ${
  //           (Date.now() - startTime) / 1000
  //         } seconds`
  //       );

  //       if (!headers || rows.length === 0) {
  //         console.error('Excel file is empty or incorrectly formatted.');
  //         return;
  //       }

  //       const chunkSize = 500;
  //       const totalChunks = Math.ceil(rows.length / chunkSize);
  //       console.log(
  //         `Loop starts here..Time taken: ${
  //           (Date.now() - startTime) / 1000
  //         } seconds`
  //       );
  //       for (let i = 0; i < rows.length; i += chunkSize) {
  //         const chunk = rows.slice(i, i + chunkSize);

  //         setTimeout(() => {
  //           this.processChunk(chunk, headers, i / chunkSize + 1);
  //           processedChunks++;

  //           if (processedChunks === totalChunks) {
  //             this.logFinalTotals();

  //             this.finalMergedObject = [
  //               ...this.over50PercentData,
  //               ...this.highData,
  //               ...this.mediumData,
  //               ...this.lowData,
  //             ];
  //             console.log('Final Merged Object:', this.finalMergedObject);

  //             // Save to Firestore
  //             const saveStartTime = Date.now();
  //             console.log('Starting save to Firestore...');
  //             this.authService
  //               .saveExcelDataBatch2(this.finalMergedObject)
  //               .subscribe({
  //                 next: () => {
  //                   const saveEndTime = Date.now();
  //                   console.log(
  //                     `Data saved to Firestore successfully. Time taken: ${
  //                       (saveEndTime - saveStartTime) / 1000
  //                     } seconds`
  //                   );
  //                 },
  //                 error: (err) => {
  //                   console.error('Error saving data to Firestore:', err);
  //                 },
  //               });
  //           }
  //         }, 0);
  //       }
  //       console.log(
  //         `Loop ends here..data processed..Time taken: ${
  //           (Date.now() - startTime) / 1000
  //         } seconds`
  //       );
  //     } catch (error) {
  //       console.error('Error processing the Excel file:', error);
  //     }
  //   };

  //   reader.onerror = (error) => {
  //     console.error('Error reading file:', error);
  //   };

  //   reader.readAsBinaryString(file);
  // }

  onFileChange2(event: any): void {
    const startTime = Date.now(); // Overall start time
    this.startTime = startTime;
    let processedChunks = 0;

    this.validationErrors = [];
    this.over50PercentData = [];
    this.highData = [];
    this.mediumData = [];
    this.lowData = [];
    this.finalMergedObject = [];

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        console.log(
          `Excel will be imported by utility now..Time taken till here: ${
            (Date.now() - startTime) / 1000
          } seconds`
        );
        const binaryData = e.target.result;
        const workbook = XLSX.read(binaryData, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headers: any = data[0];
        console.log(
          `Rows will be created now..Time taken till here: ${
            (Date.now() - startTime) / 1000
          } seconds`
        );
        const rows = data.slice(10001, 20000);
        console.log(
          `Rows Generated. Time taken: ${
            (Date.now() - startTime) / 1000
          } seconds`
        );

        if (!headers || rows.length === 0) {
          console.error('Excel file is empty or incorrectly formatted.');
          return;
        }

        const chunkSize = 500;
        const totalChunks = Math.ceil(rows.length / chunkSize);
        console.log(
          `Loop starts here..Time taken: ${
            (Date.now() - startTime) / 1000
          } seconds`
        );
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);

          setTimeout(() => {
            this.processChunk(chunk, headers, i / chunkSize + 1);
            processedChunks++;

            if (processedChunks === totalChunks) {
              this.logFinalTotals();

              const categorizedData = {
                primary: this.over50PercentData,
                high: this.highData,
                medium: this.mediumData,
                low: this.lowData,
              };

              console.log('Categorized Data:', categorizedData);

              // Save to Firestore
              console.log('Starting save to Firestore...');
              const saveStartTime = Date.now();
              // this.authService
              //   .saveExcelDataBatchByCategory(categorizedData)
              //   .subscribe({
              //     next: () => {
              //       const saveEndTime = Date.now();
              //       console.log(
              //         `Data saved to Firestore successfully. Time taken: ${
              //           (saveEndTime - saveStartTime) / 1000
              //         } seconds`
              //       );
              //     },
              //     error: (err) => {
              //       console.error('Error saving data to Firestore:', err);
              //     },
              //   });
            }
          }, 0);
        }
        console.log(
          `Loop ends here..data processed..Time taken: ${
            (Date.now() - startTime) / 1000
          } seconds`
        );
      } catch (error) {
        console.error('Error processing the Excel file:', error);
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };

    reader.readAsBinaryString(file);
  }

  processChunk(chunk: any[], headers: any[], chunkIndex: number): void {
    const filledCounts: number[] = [];
    const totalColumns = headers.length;

    const rowObjects: any[] = chunk.map((row: any, rowIndex: number) => {
      const rowObject = headers.reduce((acc: any, header: any, index: any) => {
        acc[header] = row[index] || null;
        return acc;
      }, {} as Record<string, any>);

      const filledCount = Object.values(rowObject).filter(
        (value) => value !== null && value !== undefined && value !== ''
      ).length;
      filledCounts.push(filledCount);

      // Validate row to convert to desired format
      const validatedRow = this.validateRow(rowObject, rowIndex + 2);

      return { rowObject: validatedRow, filledCount };
    });

    const maxFilled = Math.max(...filledCounts);
    const minFilled = Math.min(...filledCounts);
    const thresholdHigh = maxFilled - Math.floor((maxFilled - minFilled) / 3);
    const thresholdLow = minFilled + Math.floor((maxFilled - minFilled) / 3);

    // Categorize rows into desired objects
    const over50PercentFilled = rowObjects.filter(
      (row) => row.filledCount / totalColumns > 0.5 && row.rowObject
    );
    const highFilled = rowObjects.filter(
      (row) =>
        row.filledCount >= thresholdHigh &&
        row.filledCount / totalColumns <= 0.5 &&
        row.rowObject
    );
    const mediumFilled = rowObjects.filter(
      (row) =>
        row.filledCount < thresholdHigh &&
        row.filledCount >= thresholdLow &&
        row.rowObject
    );
    const lowFilled = rowObjects.filter(
      (row) => row.filledCount < thresholdLow && row.rowObject
    );

    // Append to respective arrays
    this.over50PercentData.push(...over50PercentFilled.map((r) => r.rowObject));
    this.highData.push(...highFilled.map((r) => r.rowObject));
    this.mediumData.push(...mediumFilled.map((r) => r.rowObject));
    this.lowData.push(...lowFilled.map((r) => r.rowObject));

    // Update cumulative totals
    this.totalOver50PercentFilled += over50PercentFilled.length;
    this.totalHighFilled += highFilled.length;
    this.totalMediumFilled += mediumFilled.length;
    this.totalLowFilled += lowFilled.length;
  }

  updateRange(range: { min: number; max: number }, rows: any[]): void {
    rows.forEach((row) => {
      range.min = Math.min(range.min, row.filledCount);
      range.max = Math.max(range.max, row.filledCount);
    });
  }

  logFinalTotals(): void {
    console.log('Final Totals:');
    console.log(`Over 50% Filled Count: ${this.totalOver50PercentFilled}`);
    console.log(`High Filled Count: ${this.totalHighFilled}`);
    console.log(`Medium Filled Count: ${this.totalMediumFilled}`);
    console.log(`Low Filled Count: ${this.totalLowFilled}`);

    console.log('Over 50% Data:', this.over50PercentData);
    console.log('High Data:', this.highData);
    console.log('Medium Data:', this.mediumData);
    console.log('Low Data:', this.lowData);
  }
  // Validation logic for each row
  parseDynamicPlaintiffs(
    row: Record<string, any>,
    rowNumber: number
  ): ContactPerson[] {
    const plaintiffPersons: ContactPerson[] = [];
    for (let i = 1; i <= 5; i++) {
      // Match keys with Excel file headers
      const name = row[`PA Name ${i}`];
      const phone = row[`PA Phone ${i}`];
      const email = row[`PA Email ${i}`];

      if (name || phone || email) {
        // if (!name) {
        //   this.validationErrors.push(
        //     `Row ${rowNumber}: PA Name ${i} is required.`
        //   );
        // }
        plaintiffPersons.push({
          name: name || '',
          phone: phone || '',
          email: email || '',
        });
      }
    }
    // console.log('Parsed Plaintiff Persons:', plaintiffPersons); // Debugging output
    return plaintiffPersons;
  }

  parseDynamicDefendants(
    row: Record<string, any>,
    rowNumber: number
  ): ContactPerson[] {
    const defendantPersons: ContactPerson[] = [];
    for (let i = 1; i <= 5; i++) {
      // Match keys with Excel file headers
      const name = row[`DA Name ${i}`];
      const phone = row[`DA Phone ${i}`];
      const email = row[`DA Email ${i}`];

      if (name || phone || email) {
        // if (!name) {
        //   this.validationErrors.push(
        //     `Row ${rowNumber}: DA Name ${i} is required.`
        //   );
        // }
        defendantPersons.push({
          name: name || '',
          phone: phone || '',
          email: email || '',
        });
      }
    }
    // console.log(defendantPersons); // Debugging output
    return defendantPersons;
  }

  validateRow(row: Record<string, any>, rowNumber: number): ExcelData | null {
    const caseComplaintDate = this.parseDate(row['Case Complaint Date']);
    const patentIssuedDate = this.parseDate(row['Patent Issued Date']);
    const patentExpiryDate = this.parseDate(row['Patent Expiry Date']);

    if (!caseComplaintDate) {
      // this.validationErrors.push(
      //   `Row ${rowNumber}: Invalid 'Case Complaint Date'.`
      // );
      return null; // Skip invalid rows
    }

    return {
      refID: this.generateRefID(),
      caseDetails: {
        caseComplaintDate,
        caseNumber: row['Case Number'],
        caseName: row['Case Name'],
        status: row['Status'],
        litigationVenues: row['Litigation Venues & Judicial Authorities'],
        courtNames: row['Court Names'],
        relatedOriginatingCases: row['Related/Originating Cases'],
        caseClosedDate: this.parseDate(row['Case Closed Date']),
      },
      patentDetails: {
        patentNo: row['Patent No'],
        techCategory: row['Tech Category'],
        technologyKeywords: row['Technology Keywords'],
        techCentre: row['Tech Centre'],
        patentIssuedDate,
        patentExpiryDate,
        acquiredPatentOrOrganicPatent:
          row['Acquired Patent or Organic patent?'],
        originalAssignee: row['Original Assignee'],
        currentAssignee: row['Current Assignee'],
        assigneeTimeline: row['Assignee Timeline'],
      },
      infringementDetails: {
        accusedProduct: row['Accused Product'],
        chancesOfWinning: row['Chances of Winning'],
        typeOfInfringement: row['Type of Infringement'],
        caseStrengthLevel: row['Case Strength Level'],
        numberOfInfringedClaims: row['Number of Infringed Claims'],
        numberOfDefendants: row['Number of Defendants'],
        otherDefendants: row['Other Defendants'],
        thirdPartyFundingInvolved: row['3rd Party Funding Involved'],
        singlePatentOrFamilyInvolved: row['Single Patent or Family Involved?'],
      },
      citationDetails: {
        backwardCitation: row['Backward Citation'],
        forwardCitation: row['Forward Citation'],
      },
      legalEntities: {
        plaintiffPersons: this.parseDynamicPlaintiffs(row, rowNumber),
        defendantPersons: this.parseDynamicDefendants(row, rowNumber),
        plaintiffOrPetitioner: row['Plaintiff/Petitioner'],
        plaintiffsLawFirmName: row["Plaintiff's Law Firm Name"],
        defendant: row['Defendant'],
        defendantLawFirmName: row['Defendant Law Firm Name'],
      },
      caseOutcome: {
        recentAction: row['Recent Action'],
        winningAmount: row['Winning Amount'],
        winningParty: row['Winning Party'],
        otherPossibleInfringer: row['Other Possible Infringer'],
        listOfPriorArt: row['List of Prior Art'],
      },
      administrativeDetails: {
        judge: row['Judge'],
        assignedJudge: row['Assigned Judge'],
        typeOfPatent: row['Type of Patent'],
        plaintiffTypeAndSize: row['Plaintiff Type & Size'],
        defendantTypeAndSize: row['Defendant Type & Size'],
        stage: row['Stage'],
      },
      industry: row['Industry'],
      activityTimeline: row['Activity Timeline'],
      standardEssentialPatent: row['Standard Essential Patent'],
      semiconductorPatent: row['Semiconductor Patent'],
      causeOfAction: row['Cause of Action'],
      artUnit: row['Art Unit'],
      reasonOfAllowance: row['Reason of Allowance'],
    };
  }

  // Parses date fields
  parseDate(value: any): Date | undefined {
    if (!value) {
      // console.warn('parseDate: Empty or null value received:', value);
      return undefined;
    }

    if (typeof value === 'number') {
      // Excel sometimes represents dates as serial numbers
      const excelEpoch = new Date(Date.UTC(1900, 0, 1));
      return new Date(excelEpoch.getTime() + (value - 2) * 86400000);
    }

    if (typeof value === 'string') {
      // Try to parse as an ISO date
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    // console.warn('parseDate: Invalid date format:', value);
    return undefined;
  }

  // Generates unique reference IDs
  generateRefID(): string {
    return `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  // Handles submission of validated Excel data
  onFileSubmit(): void {
    this.authService.saveExcelData(this.excelData).subscribe({
      next: () => {
        this.submitted = true;
        this.excelData = [];
        if (this.fileInput) this.fileInput.nativeElement.value = '';
      },
      error: (err) => console.error('Error submitting data:', err),
    });
  }

  // Handles selection of additional files for upload
  onTbFileSelected(event: any, element: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedTbFiles = Array.from(input.files);
      element.upfileURLs = [];
    }
  }

  // Uploads selected files
  async uploadTbFile(element: any): Promise<void> {
    if (this.selectedTbFiles.length > 0) {
      try {
        const urls = await this.authService.uploadFiles(this.selectedTbFiles);
        element.upfile = element.upfile || [];
        this.selectedTbFiles.forEach((file, index) => {
          element.upfile.push({
            fileName: file.name,
            fileType: file.type,
            fileUrl: urls[index],
          });
        });
        this.selectedTbFiles = [];
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
  }

  // Downloads Excel template
  downloadTemplate(): void {
    this.excelTemplateService.exportExcel();
  }
}
