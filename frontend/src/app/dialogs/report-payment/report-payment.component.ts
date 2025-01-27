import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-report-payment',
  standalone: true,
  imports: [],
  templateUrl: './report-payment.component.html',
  styleUrl: './report-payment.component.scss',
})
export class ReportPaymentComponent {
  constructor(
    public dialogRef: MatDialogRef<ReportPaymentComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { docId: string; user: any; price: number; other?: {} }
  ) {}

  /**
   * Handles payment success for the report purchase.
   */
  onPaymentSuccess() {
    console.log('Report Purchased:', this.data);
    // Add logic to update the database or mark the report as purchased
    this.dialogRef.close('success');
  }

  /**
   * Handles payment failure for the report purchase.
   */
  onPaymentFailure() {
    this.dialogRef.close('failure');
  }
}
