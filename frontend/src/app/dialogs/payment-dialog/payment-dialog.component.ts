import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Plan } from '../../static data/interfaces-and-data';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [],
  templateUrl: './payment-dialog.component.html',
  styleUrl: './payment-dialog.component.scss',
})
export class PaymentDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { plan: Plan }
  ) {}

  /**
   * Calculates the total price based on the selected plan type and seat count
   * @returns Total price
   */
  getTotalPrice(): number {
    const pricePerSeat =
      this.data.plan.planTypeSelected === 'annually'
        ? this.data.plan.annualPrice
        : this.data.plan.monthlyPrice;

    return this.data.plan.seatSelected
      ? this.data.plan.seatSelected * pricePerSeat
      : 0;
  }

  /**
   * Handles payment success
   */
  onPaymentSuccess() {
    this.dialogRef.close('success');
  }

  /**
   * Handles payment failure
   */
  onPaymentFailure() {
    this.dialogRef.close('failure');
  }
}
