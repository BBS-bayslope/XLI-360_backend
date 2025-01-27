import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Timestamp } from '@angular/fire/firestore';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  Organisation,
  subscriptionPlans,
} from '../static data/interfaces-and-data';

@Injectable({
  providedIn: 'root',
})
export class OrganisationService {
  constructor(private api: ApiService) {}

  /**
   * Calculate Expiration Date based on plan type
   * @param planType 'monthly' or 'annually'
   * @returns Date
   */
  private calculateExpirationDate(planType: 'monthly' | 'annually'): Date {
    const now = new Date();
    return planType === 'monthly'
      ? new Date(now.setDate(now.getDate() + 30))
      : new Date(now.setFullYear(now.getFullYear() + 1));
  }

  /**
   * Generate a unique organization name by checking existence and appending an integer if needed.
   * @param baseName Initial organization name
   * @param attempt Attempt number for appending
   * @returns Observable<string> Unique organization name
   */
  private generateUniqueOrgName(
    baseName: string,
    attempt: number = 0
  ): Observable<string> {
    const orgName = attempt > 0 ? `${baseName}${attempt}` : baseName;

    return this.api.checkIfOrgExists(orgName).pipe(
      switchMap((exists) => {
        if (exists) {
          return this.generateUniqueOrgName(baseName, attempt + 1);
        }
        return of(orgName);
      }),
      catchError((error) => {
        console.error(
          'Error generating unique organization name:',
          error.message
        );
        return throwError(
          () => new Error('Failed to generate unique organization name.')
        );
      })
    );
  }

  /**
   * Create a new organization with a unique name.
   * @param userEmail Email of the user creating the organization
   * @param seats Number of seats purchased
   * @param planType Subscription plan type ('monthly' or 'annually')
   * @param planName Name of the plan
   * @returns Observable<Organisation>
   */
  createNewOrganisation(
    userEmail: string,
    seats: number,
    planType: 'monthly' | 'annually',
    planName?: string
  ): Observable<Organisation> {
    if (!userEmail || seats <= 0) {
      return throwError(() => new Error('Invalid user or seat count.'));
    }

    const baseOrgName = `${userEmail.split('@')[0]}'s Organization`;

    return this.getUserOrganisations(userEmail).pipe(
      switchMap((userOrgs) => {
        // Check if an organization exists with the same planName and planType
        const existingOrg: any = userOrgs.find(
          (org) =>
            org.planNamePurchased === planName && org.planType === planType
        );

        if (existingOrg) {
          // Update the existing organization
          const updatedOrg = {
            ...existingOrg,
            purchasedSeats: existingOrg.purchasedSeats + seats,
            activeSeats: existingOrg.activeSeats + seats,
            amountPaid:
              existingOrg.amountPaid +
              this.calculateAmountPaid(planName, planType, seats),
          };

          return this.api
            .updateDocByIdAPI('organisations', existingOrg.id, updatedOrg)
            .pipe(
              map(() => updatedOrg),
              catchError((error) => {
                console.error('Error updating organization:', error.message);
                return throwError(
                  () => new Error('Failed to update organization.')
                );
              })
            );
        } else {
          // Create a new organization if no match is found
          return this.generateUniqueOrgName(baseOrgName).pipe(
            switchMap((orgName) => {
              const expirationDate = this.calculateExpirationDate(planType);

              const newOrg: Organisation = {
                name: orgName,
                createdOn: Timestamp.now(),
                createdBy: userEmail,
                purchasedSeats: seats,
                planNamePurchased: planName || 'No Plan',
                paymentStatus: 'paid',
                amountPaid: this.calculateAmountPaid(planName, planType, seats),
                activeSeats: seats,
                members: [userEmail],
                planType,
                expirationDate,
                status: 'active',
              };

              return this.api.createDocNoAuthAPI('organisations', newOrg);
            }),
            catchError((error) => {
              console.error('Error creating organization:', error.message);
              return throwError(
                () => new Error('Failed to create organization.')
              );
            })
          );
        }
      }),
      catchError((error) => {
        console.error('Error in createOrUpdateOrganisation:', error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetches all organisations
   * @returns Observable<Organisation[]>
   */
  getAllOrganisations(): Observable<Organisation[]> {
    return this.api.getAllDocsFromCollection('organisations').pipe(
      map((res) => res.map((org: any) => this.transformOrganisation(org))),
      catchError((error) => {
        console.error('Error fetching organizations:', error.message);
        return of([]);
      })
    );
  }

  getUserOrganisations(email: any): Observable<Organisation[]> {
    if (!email) {
      return throwError(() => new Error('Invalid email.'));
    }

    return this.api.getAllDocsFromCollection('organisations').pipe(
      map((res) =>
        res
          .map((org: any) => this.transformOrganisation(org))
          .filter((org: Organisation) => org.createdBy === email)
      ),
      catchError((error) => {
        console.error('Error fetching user organizations:', error.message);
        return of([]); // Return an empty array if there's an error
      })
    );
  }

  getOrganisationsByMembership(email: any): Observable<Organisation[]> {
    if (!email) {
      return throwError(() => new Error('Invalid email.'));
    }

    return this.api.getAllDocsFromCollection('organisations').pipe(
      map((res) =>
        res
          .map((org: any) => this.transformOrganisation(org))
          .filter(
            (org: Organisation) =>
              org.members.includes(email) && org.createdBy !== email
          )
      ),
      catchError((error) => {
        console.error(
          'Error fetching organisations by membership:',
          error.message
        );
        return of([]); // Return an empty array if there's an error
      })
    );
  }

  /**
   * Adds a member to an existing organisation
   * @param orgId Organisation ID
   * @param memberEmail Member's email
   * @param allOrgs List of existing organisations
   * @returns Observable<any>
   */
  addMemberToOrganisation(
    orgId: string,
    memberEmail: string,
    allOrgs: Organisation[]
  ): Observable<any> {
    const org = allOrgs.find((org: Organisation) => org.id === orgId);

    if (!org) {
      return throwError(() => new Error('Organization not found.'));
    }

    console.log(org.members.length, org.purchasedSeats);

    if (org.members.length >= org.activeSeats) {
      return throwError(() => new Error('No available seats.'));
    }

    const updatedOrg = {
      members: [...org.members, memberEmail],
      activeSeats: org.activeSeats + 1,
    };

    return this.api.updateDocByIdAPI('organisations', orgId, updatedOrg).pipe(
      catchError((error) => {
        console.error('Error adding member:', error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generates an organisation name from a user's email
   * @param userEmail User's email
   * @returns Generated organisation name
   */
  private generateOrganisationName(userEmail: string): string {
    return `${userEmail.split('@')[0]}'s Organization`;
  }

  /**
   * Transforms raw organisation data into a strongly-typed Organisation object
   * @param org Raw organisation data
   * @returns Organisation
   */
  private transformOrganisation(org: any): Organisation {
    const expirationDate =
      org.data.expirationDate && org.data.expirationDate.toDate
        ? org.data.expirationDate.toDate()
        : null;

    const currentDate = new Date();
    return {
      id: org.id,
      ...org.data,
      expirationDate,
      status:
        expirationDate && expirationDate > currentDate ? 'active' : 'inactive',
      members: org.data.members || [],
    } as Organisation;
  }

  /**
   * Calculate the total amount paid for the subscription
   * @param planName Name of the subscription plan
   * @param planType 'monthly' or 'annually'
   * @param seats Number of seats purchased
   * @returns Total amount paid
   */
  private calculateAmountPaid(
    planName: string | undefined,
    planType: 'monthly' | 'annually',
    seats: number
  ): number {
    // Find the matching plan
    const selectedPlan = subscriptionPlans.find(
      (plan) => plan.planName === planName
    );

    if (!selectedPlan) {
      console.error('Plan not found:', planName);
      return 0; // Default to 0 if plan is not found
    }

    // Use the appropriate price based on the plan type
    const pricePerSeat =
      planType === 'monthly'
        ? selectedPlan.monthlyPrice
        : selectedPlan.annualPrice;

    // Calculate total cost
    return pricePerSeat * seats;
  }
}
