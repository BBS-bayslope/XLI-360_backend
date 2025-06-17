import { inject, Injectable } from '@angular/core';
import { ExcelData } from '../pages/admin/excelDataTpes-interface';
import { HttpClient, HttpHeaders, HttpErrorResponse  } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  first,
  forkJoin,
  from,
  map,
  mergeMap,
  Observable,
  of,
  Subject,
  switchMap,
  toArray,
  tap,
  throwError
} from 'rxjs';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { user, User } from '@angular/fire/auth';
import {Router} from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // private baseUrl = 'http://18.220.232.127'; // Base API URL
  private baseUrl ="http://127.0.0.1:8000"
  private tokenKey: string = "access"; // Key to store token in localStorage
  allCases!: ExcelData[];
  selectedCase!: ExcelData;
  selectedCaseDocId: any;

  private selectedCaseSubject = new BehaviorSubject<any>(null);
  selectedCase$ = this.selectedCaseSubject.asObservable();

  private firestore = inject(Firestore);

  constructor(private http: HttpClient,
    public router: Router,
  ) {}
  
  // Remove token on logout
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('refresh');
    // localStorage.removeItem(this.tokenExpirationKey);
    // this.authStatusSubject.next(false);
    this.router.navigate(['/login']);
  }

  // Handle token expiration
  private handleUnauthorized(): void {
    this.logout(); // Clear token
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<string> {
    const endpoint = `${this.baseUrl}/api/token/refresh/`;
    const refreshToken = localStorage.getItem('refresh');
  
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }
  
    return this.http.post<any>(endpoint, { refresh: refreshToken }).pipe(
      switchMap(response => {
        if (response && response.access) {
          localStorage.setItem('access', response.access);
          localStorage.setItem('refresh', response.refresh);
          return of(response.access);
        } else {
          this.logout();
          return throwError(() => new Error('Invalid refresh response'));
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }
  
  // Login function
  login(payload:object): Observable<any> {
    const endpoint = `${this.baseUrl}/api/login/`;
    return this.http.post<any>(endpoint, payload).pipe(
      tap(response => {
        if (response && response.access) {
          localStorage.setItem(this.tokenKey, response.access);
          localStorage.setItem("refresh", response.refresh);
          console.log(response.access)
        } else {
          console.error('Invalid login response', response);
        }
        
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login failed', error);
        return of(null);
      })
    );
  }

  // Register function
  register(payload:object): Observable<any> {
    const endpoint = `${this.baseUrl}/api/register/`;
    return this.http.post<any>(endpoint, payload).pipe(
      tap(() => this.router.navigate(['/login'])),
      catchError((error: HttpErrorResponse) => {
        console.error('Registration failed', error);
        return of(null);
      })
    );
  }

  getTableData(payload: object): Observable<any> {
    const endpoint = `${this.baseUrl}/api/case-list/`;
    return this.http.post<any>(endpoint,  payload );
  }
  getFilterData(): Observable<any> {
    const endpoint = `${this.baseUrl}/api/filter-data/`;
    return this.http.get<any>(endpoint);
  }
  getDetails(payload: object): Observable<any> {
    const endpoint = `${this.baseUrl}/api/case-details/`;
    return this.http.post<any>(endpoint,payload);
  }
  getCaseStats(): Observable<any> {
    const endpoint = `${this.baseUrl}/api/case-stats/`;
    return this.http.get<any>(endpoint);
  }
  getPlaintiffTypeStats(): Observable<any> {
    const endpoint = `${this.baseUrl}/api/plaintiff-type-stats/`;
    return this.http.get<any>(endpoint);
  }
  getIndustryStats(): Observable<any> {
    const endpoint = `${this.baseUrl}/api/industry-stats/`;
    return this.http.get<any>(endpoint);
  }



  private _selectedCaseId: string = ''; // Private variable to hold the value

  // Getter for selectedCaseId
  get selectedCaseId(): string {
    return this._selectedCaseId;
  }

  // Setter for selectedCaseId
  set selectedCaseId(value: string) {
    this._selectedCaseId = value;
  }

  // Fetch data from Firestore collection
  getData(): Observable<any[]> {
    const collectionName: string = 'excelData';
    const collectionRef = collection(this.firestore, collectionName);
    return from(getDocs(collectionRef)).pipe(
      map((querySnapshot) => {
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }));
      })
    );
  }

  collectionNames = [
    'excelDataPrimary',
    'excelDataHigh',
    'excelDataMedium',
    'excelDataLow',
  ];

  fetchAllData(): Observable<any[]> {
    // Check if data exists in localStorage
    const cachedData = localStorage.getItem('fetchedData');
    if (cachedData) {
      // If cached data is available, return it as an observable
      return of(JSON.parse(cachedData));
    }

    // If no cached data, fetch from Firestore
    const fetchPromises = this.collectionNames.map((collectionName) => {
      const collectionRef = collection(this.firestore, collectionName);
      const limitedQuery = query(collectionRef, limit(50)); // Add the limit to the query

      return getDocs(limitedQuery).then((snapshot) =>
        snapshot.docs.map((doc) => ({
          id: doc.id, // Firestore document ID
          collectionName: collectionName,
          ...doc.data(), // Spread all document data
        }))
      );
    });

    // Combine all results into one observable
    return from(Promise.all(fetchPromises)).pipe(
      map((results) => {
        const combinedData = results.flat(); // Flatten the array of arrays
        // Save the combined data to localStorage
        localStorage.setItem('fetchedData', JSON.stringify(combinedData));
        return combinedData;
      }),
      catchError((error) => {
        console.error('Error fetching data from Firestore:', error);
        return of([]); // Return an empty array on error
      })
    );
  }

  updateSelectedCase(caseDetails: any): void {
    this.selectedCaseSubject.next(caseDetails);
  }

  // get data bby docid
  //   async getDataByDocId(){
  // console.log(this.selectedCaseDocId)
  //     const collectionName:string='excelData';
  //     const docRef=doc(this.firestore, collectionName,this.selectedCaseDocId)
  //     const docSnap = await getDoc(docRef);
  //   console.log(docRef);
  //   console.log(docSnap);

  //     if (docSnap.exists()) {
  //       return docSnap.data();

  //     } else {
  //       console.log('No such document!');
  //       return null;
  //     }
  //   }

  // Fetch data by document ID
  // async getDataByDocId(): Promise<any> {
  //   const collectionNames: string[] = [
  //     'excelDataPrimary',
  //     'excelDataHigh',
  //     'excelDataMedium',
  //     'excelDataLow',
  //   ];

  //   try {
  //     for (const collectionName of collectionNames) {
  //       const docRef = doc(
  //         this.firestore,
  //         collectionName,
  //         this.selectedCaseDocId
  //       );
  //       const docSnap = await getDoc(docRef);

  //       if (docSnap.exists()) {
  //         console.log(`Document found in collection: ${collectionName}`);
  //         return { data: docSnap.data(), collection: collectionName };
  //       }
  //     }

  //     console.log('Document not found in any collection!');
  //     return null;
  //   } catch (error) {
  //     console.error('Error fetching document:', error);
  //     return null;
  //   }
  // }

  updateUserData(
    userId: string,
    updates: Partial<User>
  ): Observable<User | null> {
    if (!userId) {
      return of(null);
    }

    const userRef = doc(this.firestore, `users/${userId}`);

    const updatedUserData = {
      ...updates,
    };

    return from(updateDoc(userRef, updatedUserData)).pipe(
      map(() => ({
        ...user,
        ...updatedUserData,
      }))
    );
  }

  createDocNoAuthAPI(collectionName: string, newObject: {}): Observable<any> {
    const collectionRef = collection(this.firestore, collectionName);

    return from(addDoc(collectionRef, newObject)).pipe(
      switchMap((docRef) => {
        const docId = docRef.id;
        const updatedObject = { ...newObject, docId };
        return from(updateDoc(docRef, { docId })).pipe(
          switchMap(() =>
            from(Promise.resolve({ id: docId, ...updatedObject }))
          )
        );
      })
    );
  }

  updateDocByIdAPI(
    collectionName: string,
    docId: string,
    updatedFields: Partial<any>
  ): Observable<void> {
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);
    return from(updateDoc(docRef, updatedFields));
  }

  deleteDocByIdAPI(collectionName: string, docId: string): Observable<void> {
    // Reference the Firestore document
    const docRef = doc(this.firestore, `${collectionName}/${docId}`);

    // Delete the document
    return from(deleteDoc(docRef));
  }

  getDocByIdFromCollections<T>(
    docId: string
  ): Observable<{ collectionName: string; data: T } | undefined> {
    const collectionNames = this.collectionNames;

    // Create an observable chain to search each collection
    return from(collectionNames).pipe(
      concatMap((collectionName) => {
        const docRef = doc(this.firestore, `${collectionName}/${docId}`);
        return from(getDoc(docRef)).pipe(
          map((docSnap) => {
            if (docSnap.exists()) {
              return { collectionName, data: docSnap.data() as T }; // Return data and the collection name
            } else {
              return undefined; // If not found, continue to the next collection
            }
          })
        );
      }),
      filter((result) => !!result), // Filter out undefined results
      first(undefined), // Complete the observable as soon as the document is found
      catchError((error) => {
        console.error('Error searching for document:', error);
        throw error; // Propagate error
      })
    );
  }

  getDocsByCaseNumber(caseNumber: string): Observable<any[]> {
    const collectionNames = this.collectionNames; // Replace with your collections
    const observables = collectionNames.map((collectionName) => {
      const collectionRef = collection(this.firestore, collectionName);
      const queryRef = query(
        collectionRef,
        where('caseDetails.caseNumber', '==', caseNumber)
      );

      return from(getDocs(queryRef)).pipe(
        map((querySnapshot) =>
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            collectionName,
            ...doc.data(),
          }))
        )
      );
    });

    return forkJoin(observables).pipe(
      map((results) => results.flat()), // Combine results from all collections
      catchError((error) => {
        console.error('Error fetching documents:', error);
        return of([]); // Return an empty array on error
      })
    );
  }

  getAllDocsFromCollection<T = any>(
    collectionName: string
  ): Observable<{ id: string; data: T }[]> {
    const collectionRef = collection(this.firestore, collectionName);

    return from(getDocs(collectionRef)).pipe(
      map((querySnapshot) =>
        querySnapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data() as T,
        }))
      )
    );
  }

  checkIfOrgExists(orgName: string): Observable<boolean> {
    const collectionRef = collection(this.firestore, 'organisations');
    const orgQuery = query(collectionRef, where('name', '==', orgName));

    return from(getDocs(orgQuery)).pipe(
      map((querySnapshot) => {
        return !querySnapshot.empty; // Return true if a matching document exists
      }),
      catchError((error) => {
        console.error('Error checking organization:', error);
        return of(false); // Return false if an error occurs
      })
    );
  }

  private logoClickSubject = new Subject<void>();
  logoClick$ = this.logoClickSubject.asObservable();

  emitLogoClick(): void {
    this.logoClickSubject.next();
  }
}
