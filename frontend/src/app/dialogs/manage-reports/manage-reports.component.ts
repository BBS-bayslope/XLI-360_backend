import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { doc, Firestore, onSnapshot } from 'firebase/firestore';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-manage-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatInputModule,
  ],
  templateUrl: './manage-reports.component.html',
  styleUrl: './manage-reports.component.scss',
})
export class ManageReportsComponent implements OnInit, OnDestroy {
  selectedFiles: File[] = [];
  uploadedFiles: {
    fileName: string;
    fileType: string;
    url: string;
    price: number;
  }[] = [];
  uploadError: string | null = null;
  private unsubscribeSnapshot: (() => void) | null = null;
  filePrices: number[] = []; // Track prices for each file
  priceUpdate!: string;

  constructor(
    private dialogRef: MatDialogRef<ManageReportsComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { rowId: string; collectionName: string },
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchExistingFiles();
    this.loadFromCache();

    this.unsubscribeSnapshot = this.authService.initializeRealTimeListener(
      this.data.collectionName,
      this.data.rowId,
      (updatedData) => {
        this.uploadedFiles = updatedData.quickSearchReport || [];
        console.log('Real-time data updated:', this.uploadedFiles);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
    }
  }

  updateFilePrice(index: number): void {
    const file = this.uploadedFiles[index];

    if (!file) {
      console.error('File not found at index:', index);
      return;
    }

    this.authService
      .updateFilePrice(
        this.data.collectionName,
        this.data.rowId,
        file.url,
        file.price
      )
      .then(() => {
        console.log(`Price updated successfully for file: ${file.fileName}`);
        this.priceUpdate = 'Price updated';
      })
      .catch((error) => {
        console.error('Error updating price:', error);
      });
  }

  loadFromCache(): void {
    const cachedData = localStorage.getItem('fetchedData');
    if (cachedData) {
      const allData = JSON.parse(cachedData);
      const document = allData.find(
        (item: any) =>
          item.id === this.data.rowId &&
          item.collectionName === this.data.collectionName
      );
      if (document && document.quickSearchReport) {
        this.uploadedFiles = document.quickSearchReport;
      }
    }
  }

  fetchExistingFiles(): void {
    this.authService
      .getDocFromCollection(this.data.collectionName, this.data.rowId)
      .then((doc) => {
        if (doc && doc.quickSearchReport) {
          this.uploadedFiles = doc.quickSearchReport;
        }
      })
      .catch((error) => {
        this.uploadError = `Error fetching files: ${error.message}`;
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      this.filePrices = new Array(this.selectedFiles.length).fill(0); // Initialize prices to 0
    }
  }

  uploadFilesAndUpdate(): void {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      this.uploadError = 'No files selected.';
      return;
    }

    const uploadTasks = this.selectedFiles.map((file, index) => {
      const filePath = `reports/${Date.now()}_${file.name}`;
      const filePrice = this.filePrices[index] || 0; // Get the price for the file
      return this.authService
        .uploadFileToStorage(filePath, file)
        .then((downloadUrl) => {
          this.uploadedFiles.push({
            fileName: file.name,
            fileType: file.type,
            url: downloadUrl,
            price: filePrice, // Add the price to the uploaded file details
          });
        });
    });

    Promise.all(uploadTasks)
      .then(() =>
        this.authService.updateDocInAllCollections(
          this.data.rowId,
          'quickSearchReport',
          this.uploadedFiles
        )
      )
      .then(() => {
        this.dialogRef.close(this.uploadedFiles);
      })
      .catch((error) => {
        this.uploadError = `Error uploading files or updating Firestore: ${error.message}`;
      });
  }

  deleteFile(
    file: { fileName: string; fileType: string; url: string },
    index: number
  ): void {
    this.authService
      .deleteFileFromStorageAndUpdateDoc(
        this.data.collectionName,
        this.data.rowId,
        'quickSearchReport',
        file,
        this.uploadedFiles
      )
      .then(() => {
        // Remove from the UI after successful deletion
        this.uploadedFiles.splice(index, 1);
      })
      .catch((error) => {
        console.error('Error deleting file:', error);
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
