import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // ✅ Import
import { ApiService } from '../../../../services/api.service';

interface Report {
  id: number;
  file_url: string;
  year: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  reports: Report[] = [];
  selectedPdfUrl: SafeResourceUrl | null = null; // ✅ SafeResourceUrl
  showPdf: boolean = false;

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {} // ✅ Inject DomSanitizer

  ngOnInit(): void {
    this.fetchReports();
  }

  fetchReports(): void {
    this.apiService.getReports().subscribe({
      next: (data) => {
        this.reports = data;
        console.log('Fetched reports', this.reports);
      },
      error: (error) => {
        console.error('Error fetching reports:', error);
      },
    });
  }

  viewFile(reportId: number): void {
    console.log('View button clicked for report ID:', reportId);
    this.apiService.viewReport(reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        this.selectedPdfUrl =
          this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.showPdf = true;
      },
      error: (error) => {
        console.error('Error viewing PDF:', error);
      },
    });
  }

  closePdf(): void {
    this.showPdf = false;
    this.selectedPdfUrl = null;
  }

  downloadFile(reportId: number): void {
    this.apiService.downloadReport(reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report_${reportId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
      },
    });
  }
}
