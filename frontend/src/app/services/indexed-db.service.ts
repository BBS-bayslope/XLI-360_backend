// import { Injectable } from '@angular/core';
// import { openDB, IDBPDatabase } from 'idb';
// import { ExcelData } from '../pages/admin/excelDataTpes-interface';

// interface DatabaseSchema {
//   LargeDataset: {
//     key: string; // Assuming the 'id' is a string
//     value: any; // Replace with your data model
//   };
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class IndexedDbService {
//   private dbPromise!: Promise<IDBPDatabase<DatabaseSchema>>;
//   private readonly DB_NAME = 'MyAppDatabase';
//   private readonly STORE_NAME = 'LargeDataset';

//   constructor() {
//     this.initDB();
//   }

//   // Initialize IndexedDB
//   private async initDB() {
//     const STORE_NAME = this.STORE_NAME; // Save STORE_NAME in a local constant
//     this.dbPromise = openDB(this.DB_NAME, 1, {
//       upgrade(db) {
//         if (!db.objectStoreNames.contains(STORE_NAME)) {
//           db.createObjectStore(STORE_NAME, { keyPath: 'docId' }); // Use the local constant
//         }
//       },
//     });
//     console.log('IndexedDB initialized with docId as the key path');
//   }

//   async addData(data: any[]): Promise<void> {
//     const db = await this.dbPromise;
//     const tx = db.transaction(this.STORE_NAME, 'readwrite');
//     const store = tx.objectStore(this.STORE_NAME);

//     data.forEach((item, index) => {
//       if (!item.docId) {
//         console.error(
//           `Skipping document with missing docId at index ${index}:`,
//           item
//         );
//       } else {
//         try {
//           store.put(item); // Add or update record
//           console.log(`Successfully inserted document:`, item);
//         } catch (err) {
//           console.error(
//             `Failed to insert document at index ${index}:`,
//             item,
//             err
//           );
//         }
//       }
//     });

//     await tx.done;
//     console.log('Data added to IndexedDB successfully.');
//   }

//   // Retrieve all data
//   async getAllData(): Promise<any[]> {
//     const db = await this.dbPromise;
//     return db
//       .transaction(this.STORE_NAME)
//       .objectStore(this.STORE_NAME)
//       .getAll();
//   }

//   // Search data by query
//   async searchDataByQuery(query: string): Promise<any[]> {
//     const db = await this.dbPromise;
//     const allData = await this.getAllData();
//     return allData.filter((item) =>
//       item.caseName.toLowerCase().includes(query.toLowerCase())
//     );
//   }

//   // Clear data
//   async clearData(): Promise<void> {
//     const db = await this.dbPromise;
//     const tx = db.transaction(this.STORE_NAME, 'readwrite');
//     await tx.objectStore(this.STORE_NAME).clear();
//     await tx.done;
//     console.log('IndexedDB cleared');
//   }

//   // indexed-db.service.ts

//   async fetchAndCacheData(fetchFunction: () => Promise<any[]>): Promise<void> {
//     const db = await this.dbPromise;

//     // Fetch data from the backend
//     const fetchedData = await fetchFunction();

//     // Add the data to IndexedDB
//     const tx = db.transaction(this.STORE_NAME, 'readwrite');
//     const store = tx.objectStore(this.STORE_NAME);

//     fetchedData.forEach((item) => store.put(item));
//     await tx.done;

//     console.log(
//       'Data fetched from backend and stored in IndexedDB:',
//       fetchedData
//     );
//   }
// }
