import { inject, Injectable } from '@angular/core';
import { ExcelData } from '../pages/admin/excelDataTpes-interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  private baseUrl = 'http://localhost:8000'; // Base API URL
  allCases!: ExcelData[];
  selectedCase!: ExcelData;
  selectedCaseDocId: any;

  private selectedCaseSubject = new BehaviorSubject<any>(null);
  selectedCase$ = this.selectedCaseSubject.asObservable();

  private firestore = inject(Firestore);

  constructor(private http: HttpClient,
    public router: Router,
  ) {}
  
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
