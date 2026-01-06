import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService, ExternalDataRow } from '../services/api.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-external-data-table',
  standalone: true,
  imports: [CommonModule,MatIconModule],
  templateUrl: './external-data-table.component.html',
  styleUrl: './external-data-table.component.scss',
})
export class ExternalDataTableComponent implements OnInit {
  rows: ExternalDataRow[] = [];
  loading = true;
  errorMessage: string | null = null;
  // router: any;

  constructor(
    private externalDataService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = null;

    this.externalDataService.getFirst100().subscribe({
      next: (data) => {
        this.rows = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Error while fetching data';
        this.loading = false;
      },
    });
  }
  goBack(): void {
    this.router.navigate(['/app-main-page']); // Navigate back to the list of cases
  }
}