import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Plan, subscriptionPlans } from '../../static data/interfaces-and-data';
import { PaymentDialogComponent } from '../../dialogs/payment-dialog/payment-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrganisationService } from '../../services/organisation.service';
import { MatButtonModule } from '@angular/material/button';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs/internal/observable/of';
import { User } from '@angular/fire/auth';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss',
})
export class SubscriptionsComponent implements OnInit {
  plans: Plan[] = subscriptionPlans;
  purchasedPlans!: any[];
  selectedPlanIndex: number = 0;
  isAnnual: boolean = true;
  userCount: number[] = [1, 1, 1, 1];
  user!: User | null;
  errorMessage!: any;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private auth: AuthService,
    private org: OrganisationService
  ) {}

  ngOnInit() {
    this.auth.getCurrentUser().subscribe((res) => {
      console.log(res?.email);
      this.user = res;
      this.org.getUserOrganisations(res?.email).subscribe((res) => {
        console.log(res);
        this.purchasedPlans = res.map((i) => ({
          planName: i.planNamePurchased,
          planType: i.planType,
        }));
        console.log(this.purchasedPlans);
      });
    });
  }

  getButtonState(plan: Plan): { label: string; color: string } {
    const selectedPlanType = this.isAnnual ? 'annually' : 'monthly';
    const isPurchased = this.purchasedPlans?.some(
      (p) => p.planName === plan.planName && p.planType === selectedPlanType
    );

    return {
      label: isPurchased ? 'Add More Seats' : 'Select Plan',
      color: isPurchased ? 'accent' : 'primary',
    };
  }

  togglePlanDuration() {
    this.isAnnual = !this.isAnnual;
  }

  incrementUser(index: number) {
    this.userCount[index]++;
  }

  decrementUser(index: number) {
    if (this.userCount[index] > 1) {
      this.userCount[index]--;
    }
  }

  getPlanPrice(plan: Plan, index: number): number {
    const price = this.isAnnual ? plan.annualPrice : plan.monthlyPrice;
    return price * this.userCount[index];
  }

  selectPlan(plan: Plan, index: number) {
    // Add selected seats and open payment dialog
    console.log(plan);
    plan.seatSelected = this.userCount[index];
    plan.planTypeSelected = this.isAnnual ? 'annually' : 'monthly';

    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '400px',
      data: { plan },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        // Update the plan with payment status and navigate
        plan.paymentStatus = 'paid';
        console.log('Payment Successful:', plan);

        this.createNewOrg(
          plan.seatSelected,
          plan.planTypeSelected,
          plan.planName
        );
      } else {
        console.log('Payment Failed:', plan);
        this.errorMessage =
          'Payment Failed! Please write to us for more details.';
      }
    });
  }

  createNewOrg(
    seats: number,
    planType: 'monthly' | 'annually',
    planName?: string
  ) {
    if (!this.user || seats <= 0) {
      this.errorMessage = 'Invalid user or seat count.';
      return;
    }

    this.org
      .createNewOrganisation(this.user.email!, seats, planType, planName)
      .pipe(
        catchError((error) => {
          this.errorMessage = error.message;
          return of(null);
        })
      )
      .subscribe((res) => {
        if (res) {
          this.errorMessage = null;
          console.log(res, 'subscription added!!');
        }
      });
  }
}
