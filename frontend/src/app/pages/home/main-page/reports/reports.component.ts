import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // ✅ Import

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

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {} // ✅ Inject DomSanitizer

  ngOnInit(): void {
    this.fetchReports();
  }

  fetchReports(): void {
    this.http.get<Report[]>('http://localhost:8000/api/reports/').subscribe({
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
    const report = this.reports.find((r) => r.id === reportId);
    if (report) {
      const unsafeUrl = `http://localhost:8000/api/view/${reportId}/`;
      this.selectedPdfUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl(unsafeUrl); // ✅ Bypass
      this.showPdf = true;
    }
  }

  closePdf(): void {
    this.showPdf = false;
    this.selectedPdfUrl = null;
  }

  downloadFile(reportId: number): void {
    const downloadUrl = `http://localhost:8000/api/view/${reportId}/?download=true`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `report_${reportId}.pdf`); 
    // link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
