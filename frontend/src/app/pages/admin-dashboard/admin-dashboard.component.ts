import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthService } from '../../services/auth.service';
import { ExcelData, UploadedFile } from '../admin/excelDataTpes-interface';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    FormsModule,
    MatIcon,
    MatFormFieldModule,
    CommonModule,
    MatAutocompleteModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  excelData: any[] = [];
  // dataSource = new MatTableDataSource<any>([]);
  options: any[] = [];

  //Variable for search Functionality
  searchInputText: string = '';
  filteredSearchInputData: any[] = [];

  displayedColumns: string[] = [
    'refID',
    'upfileURLs',
    'upfile',
    'caseComplaintDate',
    'caseNumber',
    'caseName',
    'techCategory',
    'courtNames',
    'quickSearchReport',
    'status',
    'litigationVenues',
    'relatedOriginatingCases',
    'caseClosedDate',
    'patentNo',
    'industry',
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
    'plaintiffsCompanyName',
    'plaintiffsName',
    'plaintiffsPhone',
    'plaintiffsEmail',
    'defendant',
    'defendantLawFirmName',
    'defendantAttorney',
    'defendantPhone',
    'defendantEmail',
    'assignedJudge',
    'stage',
  ];

  private authService = inject(AuthService);

  constructor() {}

  ngOnInit(): void {
    // this.authService.getData('excelData').subscribe((res) => {
    //   console.log(res);
    //   this.options = res;
    //   this.excelData = res;
    //   console.log(this.excelData);
    // });
  }

  //Logic for search Functionality

  onSearchInputText() {
    const lowerCaseTerm = this.searchInputText?.toLowerCase() || ''; // Safe handling for search input
    this.filteredSearchInputData = [];

    this.excelData.forEach((item) => {
      // Check if item.data exists before accessing properties
      if (item.data) {
        if (item.data.caseName?.toLowerCase().includes(lowerCaseTerm)) {
          this.filteredSearchInputData.push(item.data.caseName); // Add the caseName if it matches
        }
        if (item.data.caseNumber?.toLowerCase().includes(lowerCaseTerm)) {
          this.filteredSearchInputData.push(item.data.caseNumber); // Add the caseNumber if it matches
        }
        if (item.data.techCategory?.toLowerCase().includes(lowerCaseTerm)) {
          this.filteredSearchInputData.push(item.data.techCategory); // Add the techCategory if it matches
        }
        if (item.data.courtNames?.toLowerCase().includes(lowerCaseTerm)) {
          this.filteredSearchInputData.push(item.data.courtNames); // Add the courtNames if it matches
        }
        if (item.data.patentNo?.toLowerCase().includes(lowerCaseTerm)) {
          this.filteredSearchInputData.push(item.data.patentNo); // Add the patentNo if it matches
        }
        if (item.data.industry?.toLowerCase().includes(lowerCaseTerm)) {
          this.filteredSearchInputData.push(item.data.industry); // Add the industry if it matches
        }
        if (
          item.data.technologyKeywords?.toLowerCase().includes(lowerCaseTerm)
        ) {
          this.filteredSearchInputData.push(item.data.technologyKeywords); // Add the technologyKeywords if it matches
        }
        if (item.data.typeOfPatent?.toLowerCase().includes(lowerCaseTerm)) {
          this.filteredSearchInputData.push(item.data.typeOfPatent); // Add the typeOfPatent if it matches
        }
        if (
          item.data.plaintiffOrPetitioner?.toLowerCase().includes(lowerCaseTerm)
        ) {
          this.filteredSearchInputData.push(item.data.plaintiffOrPetitioner); // Add the plaintiffOrPetitioner if it matches
        }
        if (item.data.defendant?.toLowerCase().includes(lowerCaseTerm)) {
          this.filteredSearchInputData.push(item.data.defendant); // Add the defendant if it matches
        }
        if (
          item.data.standardEssentialPatent
            ?.toLowerCase()
            .includes(lowerCaseTerm)
        ) {
          this.filteredSearchInputData.push(item.data.standardEssentialPatent); // Add the standardEssentialPatent if it matches
        }
        if (
          item.data.semiconductorPatent?.toLowerCase().includes(lowerCaseTerm)
        ) {
          this.filteredSearchInputData.push(item.data.semiconductorPatent); // Add the semiconductorPatent if it matches
        }
        if (item.data.litigationVenues?.toLowerCase().includes(lowerCaseTerm)) {
          this.filteredSearchInputData.push(item.data.litigationVenues); // Add the litigationVenues if it matches
        }
      }
    });

    // Remove duplicates
    this.filteredSearchInputData = Array.from(
      new Set(this.filteredSearchInputData)
    );
  }

  onSearchTextOptionSelected(option: string) {
    const selectedData = this.excelData.filter(
      (val) =>
        val.data.caseNumber === option ||
        val.data.caseName === option ||
        val.data.techCategory === option ||
        val.data.courtNames === option ||
        val.data.patentNo === option ||
        val.data.industry === option ||
        val.data.technologyKeywords === option ||
        val.data.typeOfPatent === option ||
        val.data.plaintiffOrPetitioner === option ||
        val.data.defendant === option ||
        val.data.standardEssentialPatent === option ||
        val.data.semiconductorPatent === option ||
        val.data.litigationVenues === option
    );
    // console.log(selectedData)
    this.excelData = selectedData;
  }
  // clear the search box
  clearSearchTextInput() {
    this.searchInputText = '';
    this.excelData = this.options;
    this.filteredSearchInputData = []; // Clear the suggestions
  }

  convertToDate(datese: any): Date {
    const startDate = new Date(1900, 0, 1);
    const correctedSerial = datese - 1;
    const date = new Date(
      startDate.getTime() + correctedSerial * 24 * 60 * 60 * 1000
    );
    return date;
  }

  onDeleteColumnClick(element: any) {
    const docId = element.data.docId;
    console.log(docId);

    // try {
    this.authService.deleteAllUrls(docId, 'upfileURLs');
    console.log('All URLs deleted from Storage and Firestore successfully');
    // } catch (error) {
    // console.error('Error deleting all URLs:', error);
    // }

    // this.authService.deleteDocument(docId).then(() => {
    //   console.log('Document deleted successfully');
    // this.refreshData();
    // }).catch((error) => {
    //   console.error('Error deleting document: ', error);
    // });
  }

  refreshData() {
    // this.authService.getData('excelData').subscribe((res) => {
    //   this.excelData = res;
    // });
  }

  selectedTbFiles: File[] = [];
  // uploadPath!: string; // To store the path for uploading

  onTbFileSelected(event: Event, element: any) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedTbFiles = Array.from(input.files); // Store selected files
      // element.downloadURLs  = []; // Reset download URLs for this row if new files are selected
      // element.upfileURLs=[];
    }
  }

  // async uploadTbFile(element: any) {
  //   // const refid:string=element.data.refID;
  //   const docId:string=element.data.docId;
  //   // console.log('upd refid'+refid);
  //   console.log('upd docId'+docId);
  //   if (this.selectedTbFiles.length > 0) {
  //     try {
  //       const urls = await this.authService.uploadFiles(this.selectedTbFiles);

  //      // Prepare updated entries for Firestore
  //      const updatedUpfileEntries:any = this.selectedTbFiles.map((file, index) => ({
  //       fileName: file.name,
  //       fileUrl: urls[index],
  //       fileType: file.type, // or any other properties you want to set
  //     }));

  //     // Update upfile in Firestore
  //     await this.authService.updateFileInArray(docId, updatedUpfileEntries);

  //       this.refreshData();

  //     this.authService.addValueToArray(docId,urls);

  //       // Optional: Clear selected files after upload
  //       this.selectedTbFiles = [];

  //     } catch (error) {
  //       console.error('Upload failed:', error);
  //     }
  //     this.selectedTbFiles = []; // Clear selected files after upload

  //   }
  // }

  async uploadTbFile(element: any) {
    const docId: string = element.data.docId;
    console.log('Updating document with ID:', docId);

    if (this.selectedTbFiles.length > 0) {
      try {
        // Upload the selected files and get their URLs
        const urls = await this.authService.uploadFiles(this.selectedTbFiles);

        // Prepare updated entries for Firestore
        const updatedUpfileEntries: UploadedFile[] = this.selectedTbFiles.map(
          (file, index) => ({
            fileName: file.name,
            fileUrl: urls[index],
            fileType: file.type, // Add any other properties you want to set
          })
        );

        // Update upfile in Firestore
        for (const newFile of updatedUpfileEntries) {
          await this.authService.addFileToUpfileArray(docId, newFile);
        }

        // Optionally, refresh your data here if needed
        this.refreshData();

        // Clear selected files after upload
        this.selectedTbFiles = [];
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }

  upfile: UploadedFile[] = [];

  async onDeleteButtonClick(element: any, index: number) {
    const docId: string = element.data.docId;
    const removeurl: string = element.data.upfile[index].fileUrl;
    console.log('removeurl' + removeurl);
    console.log('refid' + docId);

    try {
      await this.authService.deleteFileByUrl(removeurl);
      console.log(`Successfully deleted ${removeurl}`);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
    this.updateFirestore(docId, 'upfileURLs', index);

    await this.authService.deleteFileFromArray(docId, removeurl);

    // this.updateFirestore(docId,'upfile');
  }

  updateFirestore(docId: string, fieldToDelete: string, index: number) {
    // Delete the field
    this.authService
      .removeUrlFromArray(docId, fieldToDelete, index)
      .then(() => {
        console.log(`Field ${fieldToDelete} deleted successfully`);
        this.refreshData(); // Refresh data after update
      })
      .catch((error) => {
        console.error('Error deleting field: ', error);
      });
  }
}
