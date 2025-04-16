import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
} from '@angular/fire/auth';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  limit,
  where,
  writeBatch,
  startAfter,
  DocumentSnapshot,
  orderBy,
  onSnapshot,
} from '@angular/fire/firestore';
import { getAuth } from 'firebase/auth';
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
  throwError,
  merge,
  concat,
  finalize
} from 'rxjs';
import {Router} from '@angular/router';
// import { catchError, finalize, map, mergeMap, switchMap } from 'rxjs/operators';
import {
  ExcelData,
  UploadedFile,
} from '../pages/admin/excelDataTpes-interface';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getStorage,
  getMetadata,
} from '@angular/fire/storage';

export interface FirestoreData {
  docId: string; // Ensure this is always present
  [key: string]: any; // Allow additional fields dynamically
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  collectionNames = [
    'excelDataPrimary',
    'excelDataHigh',
    'excelDataMedium',
    'excelDataLow',
  ];
  private userSubject: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);

  constructor(
    private http: HttpClient,
    public router: Router,
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage
  ) {
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
    });
  }
  private baseUrl = 'http://18.220.232.127'; // Base API URL
  // private baseUrl ="http://127.0.0.1:8000"
  // Get the current user as an Observable
  getUserState(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  async updateFilePrice(
    collectionName: string,
    docId: string,
    fileUrl: string,
    newPrice: number
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const files = data?.['quickSearchReport'] || [];

        // Find the file to update
        const updatedFiles = files.map((file: any) =>
          file.url === fileUrl ? { ...file, price: newPrice } : file
        );

        // Update the document with the new file list
        await updateDoc(docRef, { quickSearchReport: updatedFiles });

        console.log(`Updated price for file: ${fileUrl} to ${newPrice}`);
      } else {
        console.error('Document does not exist.');
      }
    } catch (error) {
      console.error('Error updating file price:', error);
      throw error;
    }
  }

  getDocFromCollection(collectionName: string, docId: string): Promise<any> {
    const docRef = doc(this.firestore, collectionName, docId);
    return getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        throw new Error('Document does not exist.');
      }
    });
  }

  initializeRealTimeListener(
    collectionName: string,
    docId: string,
    onUpdateCallback: (updatedData: any) => void
  ): () => void {
    const docRef = doc(this.firestore, collectionName, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          // Update localStorage cache
          const cachedData = localStorage.getItem('fetchedData');
          if (cachedData) {
            const allData = JSON.parse(cachedData);
            const updatedData = allData.map((item: any) =>
              item.id === docId && item.collectionName === collectionName
                ? { ...item, ...data }
                : item
            );
            localStorage.setItem('fetchedData', JSON.stringify(updatedData));
          }

          // Invoke the callback with updated data
          onUpdateCallback(data);
        } else {
          console.error(
            `Document ${docId} does not exist in collection ${collectionName}.`
          );
        }
      },
      (error) => {
        console.error('Error listening to Firestore document:', error);
      }
    );

    return unsubscribe; // Return the unsubscribe function to clean up
  }

  uploadFileToStorage(filePath: string, file: File): Promise<string> {
    const storageRef = ref(this.storage, filePath);
    return uploadBytes(storageRef, file)
      .then(() => getDownloadURL(storageRef))
      .catch((error) => {
        console.error('Error uploading file:', error);
        throw error;
      });
  }

  async updateDocInAllCollections(
    docId: string,
    field: string,
    files: { fileName: string; fileType: string; url: string }[]
  ): Promise<void> {
    const collections = this.collectionNames; // Replace with your collection names
    let docFound = false;

    console.log('Searching for doc:', docId);

    for (const collectionName of collections) {
      const docRef = doc(this.firestore, collectionName, docId); // Use Firestore document ID directly
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        docFound = true;
        console.log(`Document found in collection: ${collectionName}`);

        // Update the field with arrayUnion to append files
        await updateDoc(docRef, {
          [field]: arrayUnion(...files),
        });

        console.log(`Updated document in ${collectionName}:`, {
          [field]: files,
        });
        break; // Exit loop once the document is found and updated
      }
    }

    if (!docFound) {
      throw new Error(`Document with ID ${docId} not found in any collection.`);
    }
  }

  async fetchDocumentFiles(
    collectionName: string,
    docId: string,
    field: string = 'files'
  ): Promise<{ fileName: string; fileType: string; url: string }[]> {
    try {
      const docRef = doc(this.firestore, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data[field] || []; // Return the files array or an empty array
      } else {
        console.warn(
          `No document found with ID: ${docId} in collection: ${collectionName}`
        );
        return [];
      }
    } catch (error) {
      console.error('Error fetching document files:', error);
      throw error; // Propagate the error to the caller
    }
  }

  deleteFileFromStorageAndUpdateDoc(
    collectionName: string,
    docId: string,
    field: string,
    file: { fileName: string; fileType: string; url: string },
    currentFiles: { fileName: string; fileType: string; url: string }[]
  ): Promise<void> {
    const fileRef = ref(this.storage, file.url);

    return deleteObject(fileRef)
      .then(() => {
        console.log(`File ${file.fileName} deleted from storage`);

        // Remove the file from the array
        const updatedFiles = currentFiles.filter(
          (existingFile) => existingFile.url !== file.url
        );

        // Update the Firestore document
        const docRef = doc(this.firestore, collectionName, docId);
        return updateDoc(docRef, { [field]: updatedFiles }).then(() => {
          console.log('Firestore document updated successfully');
        });
      })
      .catch((error) => {
        console.error('Error during deletion:', error);
        throw error;
      });
  }

  // Get the current user value (non-observable, for synchronous access)
  getCurrentUserValue(): User | null {
    return this.userSubject.value;
  }

  // Register new user
  // register(email: string, password: string): Observable<User | null> {
  //   return from(
  //     createUserWithEmailAndPassword(this.auth, email, password)
  //   ).pipe(
  //     map((userCredential) => userCredential.user),

  //     switchMap((user) => this.saveUserData(user))
  //   );
  // }

  // Login existing user
  // login(email: string, password: string): Observable<User | null> {
  //   return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
  //     map((userCredential) => userCredential.user)
  //   );
  // }

  // Google sign-in
  // googleLogin(): Observable<User | null> {
  //   const provider = new GoogleAuthProvider();
  //   provider.setCustomParameters({
  //     prompt: 'select_account',
  //   });
  //   return from(signInWithPopup(this.auth, provider)).pipe(
  //     map((userCredential) => userCredential.user),
  //     switchMap((user) => this.saveUserData(user))
  //   );
  // }

  googleLogin(): Observable<any> {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    return from(signInWithPopup(auth, provider)).pipe(
      switchMap((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const idToken = credential?.idToken;

        if (!idToken) {
          throw new Error('No ID token found');
        }

        // Send the Google ID token to your backend to exchange for a custom JWT
        return this.http.post(`${this.baseUrl}/api/google-login/`, { idToken }).pipe(
          map((response: any) => {
            // Assuming the backend returns a JWT token and user data
            localStorage.setItem('access', response.token); // Store the JWT token
            localStorage.setItem("refresh", response.refresh);
            console.log(response.token)
             // Store the JWT token
            return {
              email: result.user.email,
              uid: result.user.uid,
              token: response.token,
            };
          })
        );
      })
    );
  }

  // Forgot password (reset password)
  forgotPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  // Logout
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  // Get current authenticated user
  getCurrentUser(): Observable<User | null> {
    return new Observable<User | null>((subscriber) => {
      onAuthStateChanged(this.auth, (user) => {
        subscriber.next(user);
      });
    });
  }

  getUserDataByUID(uid: string): Observable<any | null> {
    const userRef = doc(this.firestore, `users/${uid}`); // Reference to the user document

    return from(getDoc(userRef)).pipe(
      map((docSnapshot) => {
        if (docSnapshot.exists()) {
          return docSnapshot.data(); // Return user data
        } else {
          console.error('No such document!');
          return null; // Return null if the document does not exist
        }
      })
    );
  }

  //save user-data in firebase

  private saveUserData(user: User | null): Observable<User | null> {
    if (!user) {
      return of(null);
    }

    const userRef = doc(this.firestore, `users/${user.uid}`); // Reference to Firestore 'users' collection

    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '', // Use empty string if displayName is not available
    };

    return from(setDoc(userRef, userData, { merge: true })).pipe(
      map(() => user) // Return the user after data is saved
    );
  }

  //save excel-data in firebase
  saveExcelData(excelData: ExcelData[]): Observable<string> {
    console.log('Processing excel data:', excelData);

    const excelDataRef = collection(this.firestore, 'excelDataNew'); // Firestore collection reference

    const saveObservables = excelData.map((item) => {
      // Sanitize the data
      const sanitizedItem = this.sanitizeData(item);

      return from(addDoc(excelDataRef, sanitizedItem)).pipe(
        mergeMap((docRef) => {
          // After saving, update the `docId` field in Firestore
          const itemDocRef = doc(this.firestore, 'excelDataNew', docRef.id);
          return from(updateDoc(itemDocRef, { docId: docRef.id })).pipe(
            map(() => docRef.id) // Return the document ID
          );
        }),
        catchError((error) => {
          console.error('Error saving item:', error);
          throw error;
        })
      );
    });

    // Merge all save observables to process them sequentially or in parallel
    return merge(...saveObservables);
  }

  saveExcelDataBatch(excelData: ExcelData[]): Observable<void> {
    console.log('Processing excel data:', excelData);

    const CHUNK_SIZE = 500; // Firestore batch limit
    const excelDataRef = collection(this.firestore, 'excelDataNewBatch'); // Firestore collection reference

    let startTime: number; // Start time for measuring duration
    let endTime: number; // End time for measuring duration
    const totalChunks = Math.ceil(excelData.length / CHUNK_SIZE);

    // Function to save a single chunk using Firestore batch writes
    const saveChunk = (chunk: ExcelData[], chunkIndex: number) => {
      const batch = writeBatch(this.firestore); // Create a Firestore batch

      chunk.forEach((item) => {
        const sanitizedItem = this.sanitizeData(item); // Sanitize the data
        const docRef = doc(excelDataRef); // Generate a new document reference
        batch.set(docRef, { ...sanitizedItem, docId: docRef.id }); // Add sanitized data and set docId
      });

      // Commit the batch and handle completion
      return from(batch.commit()).pipe(
        map(() => {
          console.log(
            `Chunk ${chunkIndex + 1}/${totalChunks} of ${
              chunk.length
            } rows saved successfully`
          );
        }),
        catchError((error) => {
          console.error('Error saving chunk:', error);
          throw error;
        })
      );
    };

    // Split the data into chunks
    const chunkedObservables = [];
    for (let i = 0; i < excelData.length; i += CHUNK_SIZE) {
      const chunk = excelData.slice(i, i + CHUNK_SIZE);
      chunkedObservables.push(saveChunk(chunk, i / CHUNK_SIZE));
    }

    // Start timing
    startTime = Date.now();
    console.log('Starting data upload to Firestore...');

    // Process chunks sequentially to avoid overwhelming Firestore
    return concat(...chunkedObservables).pipe(
      finalize(() => {
        endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000; // Calculate time in seconds
        console.log(
          `All data saved successfully. Total time: ${timeTaken} seconds`
        );
      })
    );
  }

  saveExcelDataBatch2(excelData: ExcelData[]): Observable<void> {
    console.log('Processing excel data with bacth2 function:', excelData);

    const CHUNK_SIZE = 500; // Firestore batch limit
    const MAX_CONCURRENCY = 5; // Number of parallel uploads
    const excelDataRef = collection(this.firestore, 'excelDataNewBatch2'); // Firestore collection reference
    const totalChunks = Math.ceil(excelData.length / CHUNK_SIZE);
    let processedChunks = 0;

    // Function to save a single chunk using Firestore batch writes
    const saveChunk = (chunk: ExcelData[], chunkIndex: number) => {
      const batch = writeBatch(this.firestore); // Create a Firestore batch

      chunk.forEach((item) => {
        const sanitizedItem = this.sanitizeData(item); // Sanitize the data
        const docRef = doc(excelDataRef); // Generate a new document reference
        batch.set(docRef, { ...sanitizedItem, docId: docRef.id }); // Add sanitized data and set docId
      });

      // Commit the batch and handle completion
      return from(batch.commit()).pipe(
        map(() => {
          processedChunks++;
          console.log(
            `Chunk ${chunkIndex + 1}/${totalChunks} saved successfully`
          );
        }),
        catchError((error) => {
          console.error(`Error saving chunk ${chunkIndex + 1}:`, error);
          throw error;
        })
      );
    };

    // Split the data into chunks
    const chunkedObservables = [];
    for (let i = 0; i < excelData.length; i += CHUNK_SIZE) {
      const chunk = excelData.slice(i, i + CHUNK_SIZE);
      chunkedObservables.push(saveChunk(chunk, i / CHUNK_SIZE));
    }

    const startTime = Date.now();
    console.log('Starting data upload to Firestore...');

    // Process chunks in parallel with a concurrency limit
    return from(chunkedObservables).pipe(
      mergeMap((chunkObservable) => chunkObservable, MAX_CONCURRENCY),
      finalize(() => {
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000; // Calculate total time in seconds
        console.log(
          `All data saved successfully. Total time: ${totalTime} seconds`
        );
      })
    );
  }

  saveExcelDataBatchByCategory(data: {
    primary: ExcelData[];
    high: ExcelData[];
    medium: ExcelData[];
    low: ExcelData[];
  }): Observable<void> {
    const CHUNK_SIZE = 500; // Firestore batch limit
    const MAX_CONCURRENCY = 5; // Parallel uploads limit

    const saveChunks = (
      collectionName: string,
      excelData: ExcelData[]
    ): Observable<void>[] => {
      const excelDataRef = collection(this.firestore, collectionName);
      const totalChunks = Math.ceil(excelData.length / CHUNK_SIZE);

      return Array.from({ length: totalChunks }).map((_, chunkIndex) => {
        const chunkStart = chunkIndex * CHUNK_SIZE;
        const chunk = excelData.slice(chunkStart, chunkStart + CHUNK_SIZE);

        const batch = writeBatch(this.firestore);

        chunk.forEach((item) => {
          const sanitizedItem = this.sanitizeData(item); // Sanitize the data
          const docRef = doc(excelDataRef);
          batch.set(docRef, { ...sanitizedItem, docId: docRef.id });
        });

        return from(batch.commit()).pipe(
          map(() => {
            console.log(
              `Saved chunk ${
                chunkIndex + 1
              }/${totalChunks} for collection ${collectionName}`
            );
          }),
          catchError((error) => {
            console.error(
              `Error saving chunk ${
                chunkIndex + 1
              }/${totalChunks} for collection ${collectionName}:`,
              error
            );
            throw error;
          })
        );
      });
    };

    console.log('Starting data upload categorized by reliability...');
    const startTime = Date.now();

    // Create observables for all categories
    const allObservables = [
      ...saveChunks('excelDataPrimary', data.primary),
      ...saveChunks('excelDataHigh', data.high),
      ...saveChunks('excelDataMedium', data.medium),
      ...saveChunks('excelDataLow', data.low),
    ];

    // Process with concurrency limit
    return from(allObservables).pipe(
      mergeMap((chunkObservable) => chunkObservable, MAX_CONCURRENCY),
      finalize(() => {
        const totalTime = (Date.now() - startTime) / 1000;
        console.log(
          `All data saved successfully. Total time: ${totalTime} seconds`
        );
      })
    );
  }

  // Helper function to sanitize data
  private sanitizeData(item: any): any {
    return Object.fromEntries(
      Object.entries(item).map(([key, value]) => {
        if (value === undefined || value === null) {
          return [key, null];
        }
        if (value instanceof Date) {
          return [key, isNaN(value.getTime()) ? null : value]; // Handle invalid dates
        }
        if (Array.isArray(value) && value.length === 0) {
          return [key, null]; // Replace empty arrays with null
        }
        if (typeof value === 'object' && value !== null) {
          return [key, this.sanitizeData(value)]; // Recursively sanitize nested objects
        }
        return [key, value];
      })
    );
  }

  // Fetch excel-data from Firestore collection
  //  fetchCollectionData(collectionName: string): Observable<any[]> {
  //   const collectionRef = collection(this.firestore, collectionName);
  //   return from(getDocs(collectionRef)).pipe(
  //     map((querySnapshot) => {
  //       return querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
  //     })
  //   );
  // }

  // Fetch data from Firestore collection [THIS ONE IS MAIN]

  // getData(collectionName: string): Observable<any[]> {
  //   const collectionRef = collection(this.firestore, collectionName);

  //   // Calculate the timestamp for 3 years ago
  //   const threeYearsAgo = new Date();
  //   threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 2000);

  //   // Query Firestore for documents where caseComplaintDate is greater than or equal to three years ago
  //   const limitedQuery = query(
  //     collectionRef,
  //     where('caseDetails.caseComplaintDate', '>=', threeYearsAgo),
  //     limit(20) // Limit to 20 documents for performance
  //   );

  //   return from(getDocs(limitedQuery)).pipe(
  //     map((querySnapshot) => {
  //       return querySnapshot.docs.map((doc) => ({
  //         id: doc.id,
  //         data: doc.data(),
  //       }));
  //     })
  //   );
  // }

  // getData(collectionName: string): Observable<any[]> {
  //   const collectionRef = collection(this.firestore, collectionName);
  //   return from(getDocs(collectionRef)).pipe(
  //     map((querySnapshot) => {
  //       return querySnapshot.docs.map((doc) => ({
  //         id: doc.id,
  //         data: doc.data(),
  //       }));
  //     })
  //   );
  // }


  refreshToken(): Observable<string> {
    const endpoint = `${this.baseUrl}/api/token/refresh/`;
    const refreshToken = localStorage.getItem('refresh');
  
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }
  
    return this.http.post<any>(endpoint, { refresh: refreshToken }, {
      headers: { 'Skip-Auth-Interceptor': 'true' } // Custom header to signal interceptor to skip
    }).pipe(
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
      return this.http.post<any>(endpoint, payload, {
        headers: { 'Skip-Auth-Interceptor': 'true' } // Custom header to signal interceptor to skip
      }).pipe(
        tap(response => {
          if (response && response.access) {
            localStorage.setItem("access", response.access);
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
      return this.http.post<any>(endpoint, payload, {
        headers: { 'Skip-Auth-Interceptor': 'true' } // Custom header to signal interceptor to skip
      }).pipe(
        tap(() => this.router.navigate(['/login'])),
        catchError((error: HttpErrorResponse) => {
          console.error('Registration failed', error);
          return of(null);
        })
      );
    }
  

  getPaginatedData(
    collectionName: string,
    lastDoc: any = null,
    batchSize: number = 50
  ) {
    const collectionRef = collection(this.firestore, collectionName);
    let queryRef = query(
      collectionRef,
      orderBy('caseDetails.caseNumber'),
      limit(batchSize)
    );

    if (lastDoc) {
      queryRef = query(
        collectionRef,
        orderBy('caseDetails.caseNumber'),
        startAfter(lastDoc),
        limit(batchSize)
      );
    }

    return getDocs(queryRef).then((querySnapshot) => {
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));

      return { data, lastDoc: lastVisible };
    });
  }

  getInitialData(
    collectionName: string
  ): Observable<{ data: any[]; lastDoc: any }> {
    const collectionRef = collection(this.firestore, collectionName);
    const queryRef = query(
      collectionRef,
      orderBy('caseDetails.caseComplaintDate'),
      limit(50)
    );
    return from(getDocs(queryRef)).pipe(
      map((querySnapshot) => {
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        return {
          data: querySnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
          })),
          lastDoc,
        };
      })
    );
  }

  fetchMoreData(
    collectionName: string,
    lastDoc: any
  ): Observable<{ data: any[]; lastDoc: any }> {
    const collectionRef = collection(this.firestore, collectionName);
    const queryRef = query(
      collectionRef,
      orderBy('caseDetails.caseComplaintDate'),
      startAfter(lastDoc),
      limit(50)
    );
    return from(getDocs(queryRef)).pipe(
      map((querySnapshot) => {
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        return {
          data: querySnapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
          })),
          lastDoc,
        };
      })
    );
  }

  // getData(collectionName: string): Observable<any[]> {
  //   return this.firestore.collection(collectionName).valueChanges();
  // }

  // uploadFile(file: File): Promise<string> {
  //   return new Promise<string>((resolve, reject) => {
  //     const filePath = `uploads/${file.name}`;
  //     const storageRef = ref(this.storage, filePath);

  //     uploadBytes(storageRef, file)
  //       .then(() => getDownloadURL(storageRef))
  //       .then(url => resolve(url))
  //       .catch(error => reject(error));
  //   });
  // }

  uploadFiles(files: File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  private async uploadFile(file: File): Promise<string> {
    const filePath = `uploads/${file.name}`;
    const fileRef = ref(this.storage, filePath);

    await uploadBytes(fileRef, file);
    // Get the download URL
    const url = await getDownloadURL(fileRef);
    return url;
  }

  // private async updateFirestoreAfterDeletion(refid: string, fileName: string) {
  //   // Reference to the Firestore document you want to update
  //   const docRef = doc(this.firestore, 'files', refid); // Adjust the collection and document path as necessary

  //   try {
  //     // Update the Firestore document to remove the file name or update accordingly
  //     await updateDoc(docRef, {
  //       // Assuming `upfile` is an array in your document
  //       upfile: this.firestore.FieldValue.arrayRemove(fileName) // Remove fileName from the upfile array
  //     });
  //     console.log(`Firestore updated successfully for ${fileName}`);
  //   } catch (error) {
  //     console.error('Error updating Firestore:', error);
  //   }
  // }

  //delete file in field excel or pdf
  async deleteFile(fileName: string): Promise<void> {
    console.log('aut storage:-' + fileName);
    const filePath = `uploads/${fileName}`; // Construct the file path
    const fileRef = ref(this.storage, filePath); // Create a reference to the file

    try {
      await deleteObject(fileRef); // Delete the file
      console.log(`File ${filePath} deleted successfully.`);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  //delete column in firestore.
  deleteDocument(docId: string): Promise<void> {
    // Specify the collection name and the document ID
    const documentRef = doc(this.firestore, 'excelData', docId);
    return deleteDoc(documentRef);
  }

  //update i firestore
  // Method to update a specific field in a document
  // updateField(docId: string, field: string,index:Number): Promise<void> {
  //   const docRef = doc(this.firestore, 'excelData', docId);

  //   return updateDoc(docRef, {
  //     [field]: null
  //   });
  // }

  async removeUrlFromArray(
    docId: string,
    field: string,
    index: number
  ): Promise<void> {
    const docRef = doc(this.firestore, 'excelData', docId);

    // Fetch the current document to get the existing array
    const docSnapshot = await getDoc(docRef);
    if (docSnapshot.exists()) {
      const currentData = docSnapshot.data();
      const currentArray = currentData[field] || [];

      // Ensure the index is valid
      if (index >= 0 && index < currentArray.length) {
        const urlToRemove = currentArray[index];

        // Update Firestore by removing the specific URL
        await updateDoc(docRef, {
          [field]: arrayRemove(urlToRemove), // Remove the URL from the array
        });

        console.log(`Removed URL: ${urlToRemove} from ${field}`);
      } else {
        console.warn('Invalid index');
      }
    } else {
      console.error('Document does not exist');
    }
  }

  async addValueToArray(docId: string, newValue: string[]) {
    const docRef = doc(this.firestore, 'excelData', docId);

    try {
      await updateDoc(docRef, {
        upfileURLs: arrayUnion(...newValue),
      });
      console.log('Value added successfully');
    } catch (error) {
      console.error('Error adding value: ', error);
    }
  }

  private storage1 = getStorage();

  async deleteFileByUrl(fileUrl: string) {
    try {
      // Extract the path from the URL
      const path = this.getPathFromUrl(fileUrl);
      const fileRef = ref(this.storage1, path);

      // Delete the file
      await deleteObject(fileRef);
      console.log('File deleted successfully:', fileUrl);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  private getPathFromUrl(fileUrl: string): string {
    // The URL is structured like:
    // https://firebasestorage.googleapis.com/v0/b/[BUCKET_NAME]/o/[ENCODED_PATH]?alt=media&token=[TOKEN]
    const urlParts = fileUrl.split('/o/');
    if (urlParts.length > 1) {
      // The path is encoded, so we need to decode it
      const encodedPath = urlParts[1].split('?')[0];
      return decodeURIComponent(encodedPath); // Decode the path
    }
    throw new Error('Invalid file URL');
  }

  // Method to delete all files and update Firestore
  async deleteAllUrls(docId: string, field: string): Promise<void> {
    console.log(field);
    console.log(docId);
    const docRef = doc(this.firestore, 'excelData', docId);

    // Fetch the current document to get the existing array
    const docSnapshot = await getDoc(docRef);
    if (docSnapshot.exists()) {
      const currentData = docSnapshot.data();
      const currentArray = currentData[field] || [];

      // Delete each file from Storage
      for (const url of currentArray) {
        console.log('322:- ' + url);
        await this.deleteFileByUrl(url);
      }

      // Clear the array in Firestore
      await this.deleteDocument(docId);
    } else {
      console.error('Document does not exist');
    }
  }

  // Method to remove all URLs from Firestore
  // async clearFirestoreUrls(docId: string, field: string): Promise<void> {
  //   const docRef = doc(this.firestore, 'excelData', docId);
  //   await updateDoc(docRef, {
  //     [field]: [] // Set the field to an empty array
  //   });
  //   console.log('Firestore array cleared');
  // }

  // private storage = getStorage(); // Initialize storage

  // y w
  async addFileToUpfileArray(
    docId: string,
    newFile: UploadedFile
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'excelData', docId);

      // Add the new file to the upfile array
      await updateDoc(docRef, {
        upfile: arrayUnion(newFile), // Ensure newFile has no nested arrays
      });

      console.log('New file added to the upfile array successfully.');
    } catch (error) {
      console.error('Error adding file to Firestore:', error);
    }
  }

  //y
  async deleteFileFromArray(docId: string, fileUrl: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'excelData', docId);

      // Fetch the current document to get the existing upfile array
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        const currentData = docSnapshot.data();
        const currentUpfile: UploadedFile[] = currentData?.['upfile'] || [];

        // Log the current array for debugging
        console.log('Current upfile array:', currentUpfile);
        console.log('Looking for fileUrl:', fileUrl);

        // Find the index of the file to delete
        const index = currentUpfile.findIndex(
          (file) => file.fileUrl === fileUrl
        );

        if (index !== -1) {
          // Remove the specific file from the array
          const fileToDelete = currentUpfile[index];

          // Update the Firestore document
          await updateDoc(docRef, {
            upfile: arrayRemove(fileToDelete), // Remove the found file
          });

          console.log('File deleted successfully:', fileToDelete);
        } else {
          console.log('File not found in the upfile array.');
        }
      } else {
        console.error('Document does not exist');
      }
    } catch (error) {
      console.error('Error deleting file from Firestore:', error);
    }
  }
}
