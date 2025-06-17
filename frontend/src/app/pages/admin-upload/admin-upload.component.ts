import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Report {
  id: number;
  file_url: string;
  year: string;
}

@Component({
  selector: 'app-admin-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-upload.component.html',
  styleUrl: './admin-upload.component.scss',
})
export class AdminUploadComponent {
  selectedFile: File | null = null;
  year: string = '';
  uploadMessage: string | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log('Selected file:', this.selectedFile);
    }
  }

  uploadReport(): void {
    if (!this.selectedFile || !this.year) {
      this.uploadMessage = 'Please select a file and enter a year.';
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('year', this.year);

    this.http
      .post<Report>('http://localhost:8000/api/reports/', formData)
      .subscribe({
        next: (newReport) => {
          console.log('Report uploaded:', newReport);
          this.uploadMessage = 'Report uploaded successfully!';
          this.selectedFile = null;
          this.year = '';
          const fileInput = document.getElementById(
            'fileInput'
          ) as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        },
        error: (error) => {
          console.error('Error uploading report:', error);
          this.uploadMessage =
            'Error uploading report: ' +
            (error.error?.error || 'Unknown error');
        },
      });
  }
}
