import { Timestamp } from '@angular/fire/firestore';

export const subscriptionPlans: Plan[] = [
  {
    planName: 'Corporate Plan',
    monthlyPrice: 500,
    annualPrice: 5000,
    included: [
      'Case List',
      'Analytics',
      'Prediction & Recommendation',
      'Database',
      'Reports',
    ],
    complimentaryReport: true,
    emailType: 'Work Email',
    planTypeSelected: 'monthly',
    seatSelected: 1, // Default value set to 1
    paymentStatus: 'unpaid', // Default value
  },
  {
    planName: 'Law Firm Plan',
    monthlyPrice: 500,
    annualPrice: 5000,
    included: [
      'Case List',
      'Analytics',
      'Prediction & Recommendation',
      'Database',
      'Reports',
    ],
    complimentaryReport: true,
    emailType: 'Work Email',
    planTypeSelected: 'monthly',
    seatSelected: 1, // Default value set to 1
    paymentStatus: 'unpaid', // Default value
  },
  {
    planName: 'Service Provider Plan',
    monthlyPrice: 150,
    annualPrice: 1500,
    included: [
      'Case List',
      'Analytics',
      'Prediction & Recommendation',
      'Database',
      'Reports',
    ],
    complimentaryReport: false,
    emailType: 'Work Email',
    planTypeSelected: 'monthly',
    seatSelected: 1, // Default value set to 1
    paymentStatus: 'unpaid', // Default value
  },
  {
    planName: 'Adhoc Plan',
    monthlyPrice: 50,
    annualPrice: 500,
    included: [
      'Case List',
      'Analytics',
      'Prediction & Recommendation',
      'Database',
      'Reports',
    ],
    complimentaryReport: false,
    emailType: 'Any Email',
    planTypeSelected: 'monthly',
    seatSelected: 1, // Default value set to 1
    paymentStatus: 'unpaid', // Default value
  },
];

export interface Plan {
  planName: string;
  monthlyPrice: number;
  annualPrice: number;
  included: string[];
  complimentaryReport: boolean;
  emailType: string;
  seatSelected: number;
  paymentStatus: string;
  planTypeSelected: 'monthly' | 'annually';
}

export interface Organisation {
  id?: string;
  name: string;
  createdOn: Timestamp;
  createdBy: string;
  purchasedSeats: number;
  planNamePurchased: string;
  amountPaid: number;
  paymentStatus: string;
  activeSeats: number;
  members: string[];
  planType: 'monthly' | 'annually';
  expirationDate: Date | null;
  status: 'active' | 'inactive';
}
