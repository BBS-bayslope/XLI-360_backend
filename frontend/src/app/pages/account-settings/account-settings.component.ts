import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { GooglePlacesDirective } from '../../directives/google-places.directive';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';

import { MatSelectModule } from '@angular/material/select';
import { OrganisationService } from '../../services/organisation.service';
import { Organisation, Plan } from '../../static data/interfaces-and-data';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [
    MatButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    GooglePlacesDirective,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    RouterModule,
  ],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
})
export class AccountSettingsComponent implements OnInit {
  user: User | null = null;
  userData: any | null = null;
  userInfo!: any;
  curretuserUID!: string;
  currentSection: string = 'myAccount';
  profileForm!: FormGroup;
  isUpdated!: boolean;
  initialFormValues: any;
  geoLocation!: any;
  allOrgs!: any;
  errorMessage: any;
  orgDetailsActive: boolean = false;
  currentOrg!: any;
  newMemberEmail: string = '';
  newOrgSeats: number = 1; // Default to 1 seat
  newOrgPlanType: 'monthly' | 'annually' = 'monthly'; // Default to 'monthly'
  purchaseForm: boolean = false;
  purchasedPlan: Plan | null = null;
  myOrgs: Organisation[] = [];
  membershipOrgs: Organisation[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private api: ApiService,
    private orgService: OrganisationService
  ) {
    this.auth.getUserState().subscribe((user) => {
      this.user = user;
      console.log(this.user);

      if (user) {
        this.curretuserUID = user.uid;
        this.auth.getUserDataByUID(this.curretuserUID).subscribe((data) => {
          this.userData = data;
          this.profileForm.patchValue(data || {});
          this.isUpdated = false;
          this.initialFormValues = { ...this.profileForm.value };
          this.subscribeToFormChanges();
          console.log('Fetched user data:', this.userData);

          this.getMyOrgs();
          this.getMembershipOrgs();
        });
      }
    });
    this.userInfo = this.getUserDeviceInfo();
    console.log(this.userInfo);
  }

  private subscribeToFormChanges(): void {
    this.profileForm.valueChanges.subscribe(() => {
      this.isUpdated = !this.isFormReverted();
    });
  }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      uid: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      displayName: [''],
      location: this.fb.group({
        address: [''],
        sectorOrLocality: [''],
        city: [''],
        state: [''],
        country: [''],
        geoPoint: this.fb.group({
          latitude: [0],
          longitude: [0],
        }),
        pincode: [''],
      }),
    });

    this.profileForm.valueChanges.subscribe(() => {
      this.isUpdated = !this.isFormReverted();
    });
  }

  openOrgPage(orgID?: string) {
    this.orgDetailsActive = true;

    if (orgID) {
      this.currentOrg =
        this.myOrgs.find((org: any) => org.id === orgID) || null;
    } else {
      this.currentOrg = {
        data: {
          name: 'New Organisation',
          planType: '',
          expirationDate: null,
          status: 'inactive',
          members: [],
        },
      };
    }
  }
  openOrgPage2(orgID?: string) {
    this.orgDetailsActive = true;

    if (orgID) {
      this.currentOrg =
        this.membershipOrgs.find((org: any) => org.id === orgID) || null;
    } else {
      this.currentOrg = {
        data: {
          name: 'New Organisation',
          planType: '',
          expirationDate: null,
          status: 'inactive',
          members: [],
        },
      };
    }
  }

  getAllOrganisations() {
    this.orgService.getAllOrganisations().subscribe({
      next: (orgs) => {
        this.allOrgs = orgs;
        console.log('All Organizations:', this.allOrgs);
      },
      error: (error) => {
        console.error('Error fetching all organizations:', error.message);
      },
    });
  }

  getMyOrgs() {
    this.orgService.getUserOrganisations(this.user?.email).subscribe((orgs) => {
      this.myOrgs = orgs;
      console.log(orgs);
    });
  }

  getMembershipOrgs() {
    this.orgService.getOrganisationsByMembership(this.user?.email).subscribe({
      next: (orgs) => {
        this.membershipOrgs = orgs;
        console.log('Organizations where the user is a member:', orgs);
      },
      error: (error) => {
        console.error(
          'Error fetching membership organizations:',
          error.message
        );
      },
    });
  }

  addMemberToOrg(orgId: string, memberEmail: string) {
    if (!orgId || !memberEmail) {
      this.errorMessage = 'Organization ID or Member Email is missing.';
      return;
    }

    this.orgService.getAllOrganisations().subscribe({
      next: (orgs) => {
        this.allOrgs = orgs;
        console.log('All Organizations:', this.allOrgs);

        const org = this.allOrgs.find((o: Organisation) => o.id === orgId);
        if (!org) {
          this.errorMessage = 'Organization not found.';
          return;
        }

        this.orgService
          .addMemberToOrganisation(orgId, memberEmail, this.allOrgs)
          .subscribe({
            next: () => {
              console.log('Member added successfully');
              this.getMyOrgs();
              this.errorMessage = null;
            },
            error: (err) => {
              console.error('Error adding member:', err.message);
              this.errorMessage = err.message;
            },
          });
      },
      error: (error) => {
        console.error('Error fetching organizations:', error.message);
        this.errorMessage = 'Failed to fetch organizations. Please try again.';
      },
    });
  }

  private isFormReverted(): boolean {
    return (
      JSON.stringify(this.profileForm.value) ===
      JSON.stringify(this.initialFormValues)
    );
  }

  getMyLocation() {
    this.getLocation(
      (position: any) => {
        // Success callback
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        this.geoLocation = {
          latitude: latitude,
          longitude: longitude,
        };
        // Update latitude and longitude
        this.profileForm.get('location.geoPoint')?.patchValue({
          latitude: latitude,
          longitude: longitude,
        });

        this.getAddressFromCoordinates(latitude, longitude);

        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        // You can now use the latitude and longitude as needed
      },
      (error: any) => {
        // Error callback
        console.error(`Error obtaining location: ${error.message}`);
        // Handle error or fallback here
      }
    );
  }

  // Reverse geocode to get address from latitude and longitude
  getAddressFromCoordinates(lat: number, lng: number): void {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (results && status === google.maps.GeocoderStatus.OK && results[0]) {
        const address = results[0].formatted_address;
        const components = this.extractAddressComponents(results[0]);

        // Update the location group with the retrieved data
        this.profileForm.get('location')?.patchValue({
          address: address,
          sectorOrLocality: components.sectorOrLocality,
          city: components.city,
          state: components.state,
          country: components.country,
          pincode: components.pincode,
        });
      } else {
        console.error('Geocoder failed due to:', status);
      }
    });
  }

  // Extract address components from Google Places API result
  private extractAddressComponents(place: google.maps.GeocoderResult): any {
    const components: any = {};

    place.address_components.forEach((component) => {
      if (
        component.types.includes('sublocality') ||
        component.types.includes('locality')
      ) {
        components.sectorOrLocality = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        components.state = component.long_name;
      }
      if (component.types.includes('country')) {
        components.country = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        components.pincode = component.long_name;
      }
      if (component.types.includes('locality')) {
        components.city = component.long_name;
      }
    });

    return components;
  }

  onSubmit(): void {
    console.log('Form Values:', this.profileForm.value);
    this.api
      .updateUserData(this.curretuserUID, this.profileForm.value)
      .subscribe((res) => {
        console.log(res);
      });

    // Update the initial values after submission
    this.initialFormValues = { ...this.userData };
    this.profileForm.markAsPristine();
    this.isUpdated = false;
  }

  discardChanges(): void {
    this.profileForm.reset(this.userData); // Reset form to initial values
    this.isUpdated = false; // Hide Save and Discard buttons
  }

  showSection(section: string): void {
    this.currentSection = section;
  }

  logout(): void {
    // Implement logout logic here

    this.auth.logout().subscribe((res) => {
      console.log('User logged out');
      this.router.navigate(['/login']);
    });
  }

  onAddressChange(address: any) {
    console.log(address);
    const locationForm = this.profileForm.get('location');
    locationForm?.get('address')?.setValue(address.formatted_address);
    locationForm
      ?.get('country')
      ?.setValue(this.getAddressComponent(address, 'country'));
    locationForm
      ?.get('city')
      ?.setValue(
        this.getAddressComponent(address, 'locality') ||
          this.getAddressComponent(address, 'administrative_area_level_1')
      );
    locationForm
      ?.get('sectorOrLocality')
      ?.setValue(
        this.getAddressComponent(address, 'sublocality') ||
          this.getAddressComponent(address, 'neighborhood')
      );
    locationForm
      ?.get('pincode')
      ?.setValue(this.getAddressComponent(address, 'postal_code'));
    locationForm
      ?.get('state')
      ?.setValue(
        this.getAddressComponent(address, 'administrative_area_level_1')
      );
    locationForm
      ?.get('geoPoint.latitude')
      ?.setValue(address.geometry.location.lat);
    locationForm
      ?.get('geoPoint.longitude')
      ?.setValue(address.geometry.location.lng);
  }

  private getAddressComponent(address: any, type: string): string {
    const component = address.address_components.find((c: any) =>
      c.types.includes(type)
    );
    return component ? component.long_name : '';
  }

  getLocation(successCallback: any, errorCallback: any) {
    if ('geolocation' in navigator) {
      // Check if Geolocation API is available
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
        // Options
        maximumAge: 60000, // Accept cached position within 60000ms
        timeout: 10000, // Timeout in milliseconds
        enableHighAccuracy: true, // Request more accurate position
      });
    } else {
      console.error('Geolocation is not supported by your browser.');
    }
  }

  getUserDeviceInfo() {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezoneOffset = new Date().getTimezoneOffset();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cookiesEnabled = navigator.cookieEnabled;
    const localStorageSupported = typeof Storage !== 'undefined';
    const timestamp = new Date().toISOString();

    // Network Information (if available)

    return {
      userAgent, // Details about the user's browser and OS
      language, // User's preferred language
      platform, // Information about the user's platform (e.g., Win32, Linux)
      screenResolution, // Screen resolution of the user's device
      timezoneOffset, // The timezone offset in minutes
      timezone, // User's timezone
      cookiesEnabled, // Whether cookies are enabled in the browser
      localStorageSupported, // Whether localStorage is supported and enabled
      timestamp,
    };
  }

  downloadInvoice(arg0: any) {
    console.log('invoice will be downloaded');
  }
}
