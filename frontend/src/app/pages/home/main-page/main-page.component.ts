import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { DarkModeService } from 'angular-dark-mode';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HeaderComponent } from '../../../core/header/header.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  ProgressSpinnerMode,
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';
import { debounce } from 'lodash';
// CaseNameHighlightPipe
import { MatTooltipModule } from '@angular/material/tooltip';
// import { DarkModeService } from 'angular-dark-mode';
// import { MatTableModule } from '@angular/material/table';


import {
  // CaseNameHighlightPipe,
  // DarkModeService,
  collection,
  DocumentData,
  Firestore,
  getCountFromServer,
  getDocs,
  limit,
  or,
  orderBy,
  Query,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from '@angular/fire/firestore';
import { from } from 'rxjs/internal/observable/from';
import { MatCardModule } from '@angular/material/card';
import { ExcelData } from '../../admin/excelDataTpes-interface';
import { AnalyticsComponent } from './analytics/analytics.component';
import { Subscription } from 'rxjs/internal/Subscription';

import { NgCircleProgressModule } from 'ng-circle-progress';
import { CaseNameHighlightPipe } from '../../../case-name-highlight.pipe';
import { ReportsComponent } from './reports/reports.component';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    // AngularDarkModeModule,
    ReportsComponent,
    MatIconModule,
    MatTooltipModule,
    CaseNameHighlightPipe,
    MatTableModule,
    CommonModule,
    NgCircleProgressModule,
    NgCircleProgressModule,
    NgCircleProgressModule,
    MatProgressBarModule,
    MatListModule,
    MatTableModule,
    MatIcon,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatRadioModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatTabsModule,
    MatMenuModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatAutocompleteModule,
    CommonModule,
    DatePipe,
    MatPaginatorModule,
    MatPaginator,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    AnalyticsComponent,

    // AnalyticsComponent,
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainPageComponent implements OnInit, AfterViewInit, OnDestroy {
  getRange(length: number): number[] {
    return Array(Math.ceil(length / 2))
      .fill(0)
      .map((_, i) => i);
  }

  splitCaseName(name: string): { before: string; v: string; after: string } {
    const regex = /\s(v\.?|vs\.?)\s/i; // Matches "v", "v.", "vs", "vs." (case-insensitive)
    const parts = name.split(regex);

    if (parts.length >= 3) {
      return {
        before: parts[0].trim(),
        v: parts[1].trim(), // v, v., vs, etc.
        after: parts[2].trim(),
      };
    }

    return { before: name, v: '', after: '' };
  }

  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;

  tabIndex: number = 0; // Default to the first tab
  years = ['2025', '2024', '2023','']; // '' = All
  selectedYear = '';
  displayedColumns: string[] = [
    'srNo',
    'caseComplaintDate',
    'caseNumber',
    'caseName',
    'court_name',
    'status',
    'venue',
    'winningPrediction',
    'relatedCases',
  ];

  private router = inject(Router);
  private authService = inject(AuthService);
  private api = inject(ApiService);
  isLoading: boolean = false;

  @ViewChild('drawer') drawer!: MatDrawer;
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  lastVisible: (QueryDocumentSnapshot<DocumentData> | null)[] = [];
  pageSize: number = 20; // Default page size
  totalLength: number | null = 0; // Total items in the collection
  collectionNames = [
    'excelDataPrimary',
    'excelDataHigh',
    'excelDataMedium',
    'excelDataLow',
  ];
  collectionIndex: number = 0; // Track current collection
  litigationVenueOptions: string[] = [];
  selectedCourtNames: string[] = [];
  selectedSearchField: string = '';
  searchText: string = ''; // Stores search query
  refilteredCourtName: string[] = [];
  filters: { [key: string]: any } = {}; // Active filters

  searchQuery: string = ''; // Store the current search query
  isFiltering: boolean = false; // Whether the table is in filtered mode
  isLoadingSuggestions: boolean = false;
  excelData2!: ExcelData[];
  searchBy: string = 'case_name';
  private logoClickSubscription!: Subscription;
  isLoadingFilters: boolean = false;
  tempBackendResult!: any[];
  payload: any = {
    offset: 0,
    limit: this.pageSize,
  };
  tabledata: any[] = [];
  patent_types: any = [];
  acquisition_types: any = [];
  totalCount: number = 0;
  currentPage: number = 1;
  loader: boolean = false;
  winningPercentage: any = 50;
  constructor(
    private cdr: ChangeDetectorRef,
    private firestore: Firestore,
    public darkModeService: DarkModeService
  ) {}

  ngOnInit(): void {
    this.darkModeService.darkMode$.subscribe((isDarkMode) => {
      if (isDarkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    });
    // this.isLoading = true;
    this.fetchData();
    this.fetchFilterData();
    // this.getTotalCount(); // Fetch the total item count for paginator
    // this.loadPage(0, this.pageSize);
    // this.getAllLitigationVenues(); // Fetch unique litigation venues
    // this.getAllCaseStatus();

    // this.getAllTechCategory();
    // this.getAllCourtName();
    // this.getAllCaseNumber();
    // this.getAllPlaintiff();
    // this.getAllDefendant();
    // this.getAllTechnologyKeywords();
    // this.getAllPatentNo();
    // this.getAllCauseOfAction();
    // this.getAllStandardEssentialPatent();
    // this.getAllSemiconductorPatent();

    // const dates = this.getAllCaseHistory();
    this.dataSource.data = this.excelData;
    // this.getAllIndustry();
    // this.fetchAndMergeAnalyticsData();

    this.applyFilters();

    this.logoClickSubscription = this.api.logoClick$.subscribe(() => {
      this.resetTabToFirst();
    });
  }

  fileTypes = [
    { types: ['application/pdf'], label: 'PDF' },
    {
      types: [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      label: 'Excel',
    },
  ];

  filterCourtNames() {
    if (!this.searchText) {
      this.filteredCourtName = [...this.courtNameArrays];
    } else {
      this.filteredCourtName = this.courtNameArrays.filter((court) =>
        court.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }
  }

  fetchFilterData(): void {
    this.loader = true;
    this.api.getFilterData().subscribe(
      (response: any) => {
        this.litigationVenueOptions = response.litigation_venues;
        this.industryArrays = response.industry;
        this.caseStatusOptions = response.case_status;
        this.courtNameArrays = response.courtName;
        this.patent_types = response.patentType;
        this.acquisition_types = response.acquisition_type;
        this.patentNoArrays = response.patent_no;
        this.caseNumbers = response.case_no;
        this.plaintiffArrays = response.plaintiff;
        this.defendantArrays = response.defendants;
        this.technologyKeywordsArrays = response.tech_keywords;
        this.techCategoryArrays = response.tech_categories;
        this.courtNameArrays = response.courtName;
        this.causeOfActionArrays = response.cause_of_action;
        this.standardEssentialPatentArrays = response.standard_patent;
        this.semiconductorPatentArrays = response.semiconductor_patent;
        this.loader = false;
        this.cdr.detectChanges(); // Force UI to update
      },
      (error) => {
        this.loader = false;
        console.error('Error fetching data', error);
      }
    );
  }
  toggleDarkMode() {
    console.log('Toggling dark mode...');
    this.darkModeService.toggle();
    // Manual workaround
    this.darkModeService.darkMode$.subscribe((isDarkMode) => {
      document.body.classList.toggle('dark-mode', isDarkMode);
    });
  }
  selectYear(year: string): void {
    this.selectedYear = year;
    if (year) {
      this.payload.year = year; // Only add year to payload if it's not empty
    } else {
      delete this.payload.year; // Remove the year property when "All" is selected
    }
    this.fetchData();
  }

  noDataFound: boolean = false;
  //ye mera code hai
  fetchData(): void {
    this.loader = true;

    this.api.getTableData(this.payload).subscribe(
      (response: any) => {
        this.tabledata = response.data.map((item: any) => ({
          ...item,
          case_no: item.case_no || item.caseNumber || '',
          case_name: item.case_name || item.caseName || '',
        }));

        // Check if any search filter was applied
        const searchValue = (
          this.payload.case_no ||
          this.payload.case_name ||
          ''
        ).toLowerCase();

        if (searchValue) {
          this.tabledata = this.tabledata.filter(
            (item) =>
              item.case_no?.toLowerCase().includes(searchValue) ||
              item.case_name?.toLowerCase().includes(searchValue)
          );
        }

        // Set table data and status flags
        this.totalCount = response.total_count;
        this.dataSource.data = this.tabledata;
        this.noDataFound = this.tabledata.length === 0;

        this.loader = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error fetching data', error);

        // On error, reset data
        this.tabledata = [];
        this.dataSource.data = [];
        this.noDataFound = true;

        this.loader = false;
        this.cdr.detectChanges();
      }
    );
  }

  // yha tak
  getFileDetails(
    files: { fileName: string; fileType: string; url: string }[],
    types: string[]
  ): { url: string; fileName: string; icon: string } | null {
    if (!files || files.length === 0) return null;

    const file = files.find((f) => types.includes(f.fileType));
    if (!file) return null;

    // Return the necessary details, including an appropriate icon
    const icon = this.getFileIcon(file.fileType);
    return { url: file.url, fileName: file.fileName, icon };
  }

  getFileIcon(fileType: string): string {
    switch (fileType) {
      case 'application/pdf':
        return 'pdf.png';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'excel.png';
      default:
        return 'file.png'; // Default icon for unsupported file types
    }
  }

  private debounceTimer: any;

  onSearchInputText(searchText: string): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.onSearchInputTextDebounced(searchText);
    }, 300);
  }

  private async onSearchInputTextDebounced(searchText: string): Promise<void> {
    this.isFiltering = !!searchText.trim();
    this.searchQuery = searchText.trim();
    this.searchInputText = this.searchQuery;
    this.filteredSearchInputData = [];

    // Reset payload
    this.payload = {
      offset: 0,
      limit: this.pageSize,
      case_name: '',
      case_no: '',
      case_date: '',
    };

    // If searchText is a 3-digit number, search by case_no (last 3 digits)
    // Always search by case_name, even if it's numeric
    this.payload.case_name = searchText;

    // Fetch main data
    this.fetchData();

    if (!this.isFiltering) {
      this.dataSource.data = []; // Clear data only if not filtering
      this.filteredSearchInputData = [];
      this.cdr.detectChanges();
      return;
    }

    const trimmedSearchText = this.searchQuery.toLowerCase();
    const isNumeric = /^\d+$/.test(trimmedSearchText);
    const isLast3DigitSearch = trimmedSearchText.length === 3 && isNumeric;

    if (isLast3DigitSearch) {
      this.payload.case_no = ''; // Backend will handle last 3 digit match or filter in frontend
    } else if (isNumeric) {
      this.payload.case_no = trimmedSearchText;
    } else {
      this.payload.case_name = trimmedSearchText;
    }

    const cachedResults = this.searchInCache(trimmedSearchText);

    if (cachedResults.length > 0) {
      if (this.payload.case_no) {
        this.filteredSearchInputData = cachedResults
          .map((row: any) =>
            isNumeric ? row.case_no || '' : row.case_name || ''
          )
          .filter((item: string) => !!item);
        this.dataSource.data = cachedResults;
      } else {
        this.filteredSearchInputData = cachedResults
          .map((row: any) => row.data || row.case_no || '')
          .filter((item: string) => !!item);
      }
    } else {
      this.isLoadingSuggestions = true;

      try {
        const backendResults = await this.searchInBackend(
          searchText,
          0,
          this.pageSize,
          this.payload.case_no ? 'case_no' : 'case_name'
        );

        if (backendResults.length === 0 || searchText.trim().length > 2) {
          this.filteredSearchInputData = ['No results found'];
        } else {
          this.filteredSearchInputData = backendResults
            .map((row: any) => row.case_name || row.case_no || '')
            .filter((item: string) => !!item);
        }

        this.dataSource.data = backendResults;
        this.tempBackendResult = backendResults;
      } catch (error) {
        console.error('Error fetching backend suggestions:', error);
        this.filteredSearchInputData = ['Error loading suggestions'];
      } finally {
        this.isLoadingSuggestions = false;
      }
    }

    this.cdr.detectChanges();
  }

  searchInCache(searchText: string): ExcelData[] {
    if (!searchText) return this.excelData;

    const normalizedQuery = searchText.toLowerCase();
    const isThreeDigit = /^\d{1,3}$/.test(normalizedQuery);

    return this.excelData.filter((row) => {
      const caseNo = row.case_no?.toString();

      if (isThreeDigit && caseNo && caseNo.length >= 3) {
        // Match last 3 digits of the case number
        const lastThree = caseNo.slice(-3);
        return lastThree === normalizedQuery;
      }

      // General full-text search on flattened data
      const flattenedRow = this.flattenExcelData(row).toLowerCase();
      return flattenedRow.includes(normalizedQuery);
    });
  }

  // Helper to flatten the ExcelData object
  private flattenExcelData(row: ExcelData): string {
    const flattenObject = (obj: any, parentKey: string = ''): string[] => {
      let fields: string[] = [];

      for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        const value = obj[key];
        const compositeKey = parentKey ? `${parentKey}.${key}` : key;

        if (typeof value === 'object' && value !== null) {
          fields = fields.concat(flattenObject(value, compositeKey)); // Recursively flatten nested objects
        } else if (typeof value === 'string' || typeof value === 'number') {
          fields.push(`${value}`); // Convert value to string
        }
      }

      return fields;
    };

    return flattenObject(row).join(' '); // Combine all fields into a single string
  }

  searchOptions = [
    { label: 'Case Name', value: 'caseDetails.caseName' },
    // { label: 'Industry', value: 'industry' },
    // { label: 'Case Number', value: 'caseDetails.caseNumber' },
    // { label: 'Plaintiff', value: 'legalEntities.plaintiffOrPetitioner' },
    // { label: 'Defendant', value: 'legalEntities.defendant' },
    // { label: 'Patent Number', value: 'patentDetails.patentNo' },
    // { label: 'Technology Keywords', value: 'patentDetails.technologyKeywords' },
    // { label: 'Judge', value: 'administrativeDetails.judge' },
    // { label: 'Stage', value: 'administrativeDetails.stage' },
    // { label: 'Winning Party', value: 'caseOutcome.winningParty' },
    // { label: 'Accused Product', value: 'infringementDetails.accusedProduct' },
    // { label: 'Cause of Action', value: 'causeOfAction' },
  ];

  // Selected field for search
  // ; // Default to "Case Name"

  onSearchFieldChange(event: any): void {
    this.selectedSearchField = event.value;
  }

  // Get the label for the selected field
  getLabelForField(fieldValue: string): string {
    const selectedOption = this.searchOptions.find(
      (option) => option.value === fieldValue
    );
    return selectedOption?.label || 'Search Field';
  }

  // Get the field value dynamically for display in the dropdown
  getFieldValue(item: any, fieldPath: string): string {
    const fields = fieldPath.split('.'); // Split field path (e.g., "caseDetails.caseName")
    let value = item;

    // Traverse nested fields to get the value
    for (const field of fields) {
      if (value && typeof value === 'object') {
        value = value[field];
      } else {
        return 'NA'; // Return default if value is undefined
      }
    }

    return value || 'NA'; // Return the value or default to 'NA'
  }

  async searchInBackend(
    searchText: string,
    pageIndex: number,
    pageSize: number,
    searchBy: string
  ): Promise<any[]> {
    const normalizedQuery = searchText;
    const collectionName = this.collectionNames[this.collectionIndex];
    const collectionRef = collection(this.firestore, collectionName);

    try {
      console.log('this runs..', normalizedQuery, collectionName);
      // Build the query with case-insensitive filtering
      // let queryRef = query(
      //   collectionRef,
      //   or(
      //     // where('caseDetails.caseName', '>=', normalizedQuery),
      //     // where('caseDetails.caseNumber', '>=', normalizedQuery)
      //     // where('patentDetails.patentNo', '>=', normalizedQuery),
      //     // where('patentDetails.technologyKeywords', '>=', normalizedQuery),
      //     where('industry', '>=', normalizedQuery)
      //   ),
      //   limit(20),
      //   orderBy('industry')
      // );

      // Get the field based on searchBy
      console.log(this.searchBy);
      // const fieldPath = this.getFirestoreField(this.searchBy || 'Case Name');

      console.log('Searching by field:', this.searchBy);

      // Build the Firestore query
      const queryRef = query(
        collectionRef,
        where(this.searchBy, '>=', normalizedQuery),
        limit(pageSize),
        orderBy(this.searchBy)
      );

      // Execute the query
      const snapshot = await getDocs(queryRef);

      // Map the results to the ExcelData interface
      const results = snapshot.docs.map((doc, index) => ({
        id: doc.id, // Firestore document ID
        srNo: pageIndex * pageSize + index + 1, // Calculate serial number
        data: doc.data(), // Include document fields in "data" key
      }));

      console.log('Backend results:', results);

      return results;
    } catch (error) {
      console.error('Error fetching backend results:', error);
      return [];
    }
  }

  mergeSearchResults(cacheResults: any[], backendResults: any[]): any[] {
    const uniqueResults = [...cacheResults];

    backendResults.forEach((backendItem) => {
      if (!uniqueResults.some((cacheItem) => cacheItem.id === backendItem.id)) {
        uniqueResults.push(backendItem);
      }
    });

    return uniqueResults;
  }

  displaySearchResults(results: any[]): void {
    this.dataSource.data = results.slice(
      this.paginator.pageIndex * this.paginator.pageSize,
      (this.paginator.pageIndex + 1) * this.paginator.pageSize
    );
    this.cdr.detectChanges(); // Trigger change detection to update UI
  }

  async loadPage(pageIndex: number = 0, pageSize: number = 10): Promise<void> {
    if (this.isLoading) {
      console.warn(
        `Load already in progress. Skipping call for page ${pageIndex}`
      );
      return; // Prevent overlapping calls
    }

    this.isLoading = true; // Set loading flag

    try {
      console.log(`Loading page ${pageIndex} with pageSize ${pageSize}`);
      let results: any[] = [];
      let remainingSize = pageSize;
      let currentCollectionIndex = this.collectionIndex;

      // Check if filtering is active
      if (this.isFiltering && this.searchQuery) {
        // Step 1: Filter cache
        const cachedResults = this.searchInCache(this.searchQuery);

        // Paginate cached results
        results = cachedResults.slice(
          pageIndex * pageSize,
          (pageIndex + 1) * pageSize
        );
        this.filterDataForAnalytics = results;
        this.cdr.detectChanges();

        // If more results are needed, query the backend
        if (results.length < pageSize) {
          const backendResults = await this.searchInBackend(
            this.searchQuery,
            pageIndex,
            remainingSize,
            this.searchBy
          );

          // Merge results and maintain pagination
          results = this.mergeSearchResults(cachedResults, backendResults);
          results = results.slice(
            pageIndex * pageSize,
            (pageIndex + 1) * pageSize
          );
        }
      } else {
        // General (non-filtered) mode
        while (
          remainingSize > 0 &&
          currentCollectionIndex < this.collectionNames.length
        ) {
          const collectionName = this.collectionNames[currentCollectionIndex];
          const cacheKey = `collection_${collectionName}_page_${pageIndex}`;

          const data = await this.fetchWithCache(cacheKey, async () => {
            console.log(
              `Cache miss for key: ${cacheKey}. Fetching from Firebase.`
            );
            const collectionRef = collection(this.firestore, collectionName);

            let queryRef = query(
              collectionRef,
              // where('caseDetails.status', '==', this.selectedCaseStatus), // changefirst
              orderBy('caseDetails.caseComplaintDate'),
              limit(remainingSize)
            );

            if (this.selectedCaseStatus) {
              queryRef = query(
                queryRef,
                where('caseDetails.status', '==', this.selectedCaseStatus)
              );
            }
            if (this.lastVisible[currentCollectionIndex]) {
              queryRef = query(
                collectionRef,
                orderBy('caseDetails.caseComplaintDate'),
                startAfter(this.lastVisible[currentCollectionIndex]),
                limit(remainingSize)
              );
            }

            const snapshot = await getDocs(queryRef);
            this.lastVisible[currentCollectionIndex] =
              snapshot.docs[snapshot.docs.length - 1] || null;

            return snapshot.docs.map((doc, index) => ({
              id: doc.id,
              data: doc.data(),
              srNo: pageIndex * pageSize + index + 1,
            }));
          });

          results = [...results, ...data];

          if (data.length < remainingSize) {
            remainingSize -= data.length;
            currentCollectionIndex++;
          } else {
            remainingSize = 0;
          }
        }
      }

      // Update only the current page data
      this.collectionIndex = currentCollectionIndex;
      this.excelData = results; // Keep only current page data
      this.dataSource.data = this.excelData;
      console.log('Paginated Sequential Data:', this.dataSource.data);
      this.cdr.detectChanges(); // Trigger Angular change detection
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      this.isLoading = false; // Always reset loading flag
    }
  }

  onSearchTextOptionSelected(option: any, obj?: any): void {
    console.log('Selected Option:', option);

    // Step 1: Search in `excelData`
    const selectedData = this.excelData.filter((val) => {
      console.log('Checking in excelData:', val);
      return val.data?.docId === option;
    });

    if (selectedData.length > 0) {
      console.log('Data found in excelData:', selectedData);

      // Update the data source with the matched data
      this.dataSource.data = selectedData.map((item, index) => ({
        ...item,
        srNo: index + 1,
      }));
    } else {
      console.log(
        'Option not found in excelData, searching in tempBackendResult...'
      );

      // Step 2: Search in `tempBackendResult`
      const backendFilteredData = this.tempBackendResult.filter(
        (row) => row.data?.docId === option
      );

      if (backendFilteredData.length > 0) {
        console.log('Data found in tempBackendResult:', backendFilteredData);

        // Update the data source with the matched data
        this.dataSource.data = backendFilteredData.map((item, index) => ({
          ...item,
          srNo: index + 1,
        }));
      } else {
        console.log('Option not found in tempBackendResult either:', option);

        // Optionally, show an empty state or a fallback
        this.dataSource.data = [];
      }
    }

    // Trigger change detection to update the UI
    this.cdr.detectChanges();
  }

  async fetchWithCache(
    key: string,
    fetchFunction: () => Promise<any[]>
  ): Promise<any[]> {
    this.isLoading = true;
    const cachedData = localStorage.getItem(key);
    if (cachedData) {
      console.log(`Using cached data for key: ${key}`);
      return JSON.parse(cachedData);
    }

    console.log(`Fetching data for key: ${key}`);
    const data = await fetchFunction();
    localStorage.setItem(key, JSON.stringify(data));
    this.isLoading = false;

    return data;
  }

  async getTotalCount(): Promise<void> {
    try {
      console.log('Checking whether to fetch data from Firebase...');

      const collectionNames = [
        'excelDataPrimary',
        'excelDataHigh',
        'excelDataMedium',
        'excelDataLow',
      ];

      const countPromises = collectionNames.map(async (name) => {
        const queryRef = collection(this.firestore, name);

        // Fetch from Firebase if no cached data or data is outdated
        if (this.shouldFetchData() || this.getCachedCount(name) === 0) {
          console.log(`Fetching count for ${name} from Firebase...`);
          this.clearCache();

          const countSnapshot = await getCountFromServer(queryRef);
          const count = countSnapshot.data().count;
          this.updateCachedCount(name, count); // Update the cache
          return count;
        } else {
          console.log(`Using cached count for ${name}.`);
          return this.getCachedCount(name); // Retrieve the cached count
        }
      });

      const counts = await Promise.all(countPromises);

      // Update the total count
      this.totalLength = counts.reduce((total, count) => total + count, 0);

      console.log('Total Count:', this.totalLength);

      // Update fetch timestamp if data was fetched
      if (this.shouldFetchData()) {
        this.updateLastFetchedTime();
      }
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  }

  clearCache(): void {
    localStorage.clear(); // Clear all cached data
    console.log('Cache has been cleared.');
  }
  getCachedCount(collectionName: string): number {
    const cachedCounts = JSON.parse(
      localStorage.getItem('cachedCounts') || '{}'
    );
    return cachedCounts[collectionName] || 0; // Default to 0 if not found
  }

  updateLastFetchedTime(): void {
    localStorage.setItem('lastFetchedTime', String(Date.now()));
  }

  updateCachedCount(collectionName: string, count: number): void {
    const cachedCounts = JSON.parse(
      localStorage.getItem('cachedCounts') || '{}'
    );
    cachedCounts[collectionName] = count;
    localStorage.setItem('cachedCounts', JSON.stringify(cachedCounts));
  }

  shouldFetchData(): boolean {
    const lastFetchedTime =
      Number(localStorage.getItem('lastFetchedTime')) || 0;
    const currentTime = Date.now();
    const hoursSinceLastFetch =
      (currentTime - lastFetchedTime) / (1000 * 60 * 60);

    return hoursSinceLastFetch >= 1; // Fetch if 24 hours have passed
  }

  // ngAfterViewInit() {
  //   this.paginator.page.subscribe((event) => {
  //     this.loadPage(event.pageIndex, event.pageSize); // Only load paginated data on page changes
  //     this.cdr.detectChanges();
  //   });
  // }

  ngAfterViewInit() {
    //ye mera code
    this.paginator.page.subscribe((event) => {
      this.payload.offset = event.pageIndex;
      this.payload.limit = event.pageSize;
      console.log(event.pageIndex, 'dd');
      this.fetchData();
      this.cdr.detectChanges();
    });

    //

    // this.paginator.page.subscribe((event) => {
    //   if (this.selectedSources.size > 0) {
    //     // Call fetchFilteredData when filtering is active
    //     this.fetchFilteredData().then(() => {
    //       this.cdr.detectChanges(); // Ensure UI updates
    //     });
    //   } else {
    //     // Call loadPage when no filters are applied
    //     this.loadPage(event.pageIndex, event.pageSize).then(() => {
    //       this.cdr.detectChanges(); // Ensure UI updates
    //     });
    //   }
    // });
  }

  onCheckboxLitigationVenueChange(isChecked: boolean, venue: string): void {
    if (isChecked) {
      this.selectedSources.add(venue);
      this.payload.litigation_venues = this.selectedSources;
    } else {
      this.selectedSources.delete(venue);
    }

    this.payload.litigation_venues = Array.from(this.selectedSources);
    this.fetchData();
    console.log('Current Selected Sources:', Array.from(this.selectedSources));
  }

  isFilteredLoading: boolean = false;

  onCaseStatusChange(): void {
    if (this.selectedCaseStatus === 'All') {
      this.selectedCaseStatus = ''; // Clear filter if "All" is selected
    }

    console.log('Selected Case Status:', this.selectedCaseStatus);
    this.payload.case_status = this.selectedCaseStatus;
    this.fetchData();
    // this.fetchFilteredDataByCaseStatus(); // Fetch data based on the selected case status
  }
  caseStatusOptions: string[] = [];

  //
  //

  //
  //
  //
  //
  //

  //
  //
  //
  //
  //

  //
  //
  //
  //
  //

  //
  //
  //
  //
  //

  //
  //
  //
  //
  //

  //
  //
  //
  //
  //

  //
  //
  //
  //
  //

  max: number = 5;
  min: number = 0;
  showTicks = false;
  step = 1;
  thumbLabel = false;
  valueSlider = 0;
  menuIcon: boolean = false;

  showFiller = false;
  readonly panelOpenState = signal(false);
  excelData: any[] = [];
  options: any[] = [];
  toogleMenu: boolean = true;
  searchControl = new FormControl();
  selectedCaseStatus: string = '';
  selectedPatentType: string = '';
  selectedAcquisitionType: string = '';

  selectedSources: Set<string> = new Set();
  yearValueSelected: any;
  caseFilledDateArrays: Date[] = [];
  caseClosedDateArrays: Date[] = [];
  selectedFilledStartDate: Date | null = null;
  selectedFilledEndDate: Date | null = null;
  selectedClosedStartDate: Date | null = null;
  selectedClosedEndDate: Date | null = null;
  defendantInputValue: string = '';
  technologyKeywordInputValue!: string;
  standardEPInputValue!: string;

  searchInputText: string = '';
  // selectedSearchField: string = 'caseDetails.caseNumber';
  filteredSearchInputData: any[] = [];

  selectedCaseNumbers: Set<string> = new Set();
  caseNumbers: string[] = [];
  filteredCaseNumbers: string[] = [];
  caseNumberInputValue: string = '';

  selectedPlaintiff: Set<string> = new Set();
  plaintiffArrays: string[] = [];
  filteredPlaintiff: any[] = [];
  plaintiffInputValue: string = '';

  selectedDefendant: Set<string> = new Set();
  defendantArrays: string[] = [];
  filteredDefendants: any[] = [];
  DefendantInputValue: string = '';

  selectedTechnologyKeywords: Set<string> = new Set();
  technologyKeywordsArrays: string[] = [];
  filteredTechnologyKeywords: string[] = [];
  technologyKeywordsInputValue: string = '';

  selectedpatentNo: Set<string> = new Set();
  patentNoArrays: string[] = [];
  filteredPatentNos: string[] = [];
  patentNoInputValue: string = '';

  selectedCauseOfAction: Set<string> = new Set();
  causeOfActionArrays: string[] = [];
  filteredCauseOfActions: string[] = [];
  causeOfActionInputValue: string = '';

  selectedStandardEssentialPatent: Set<string> = new Set();
  standardEssentialPatentArrays: string[] = [];
  filteredStandardEssentialPatents: string[] = [];
  standardEssentialPatentInputValue: string = '';
  selectedStandardPatent: string = '';
  selectedSemiconductorpatent: string = '';

  selectedSemiconductorPatent: Set<string> = new Set();
  semiconductorPatentArrays: string[] = [];
  filteredSemiconductorPatents: string[] = [];
  semiconductorPatentInputValue: string = '';

  selectedIndustry: Set<string> = new Set();
  industryArrays: string[] = [];
  filteredIndustry: string[] = [];
  industryInputValue: string = '';

  selectedTechCategory: Set<string> = new Set();
  techCategoryArrays: string[] = [];
  filteredTechCategory: string[] = [];
  techCategoryInputValue: string = '';

  selectedCourtName: Set<string> = new Set();
  courtNameArrays: string[] = [];
  filteredCourtName: string[] = [];
  courtNameInputValue: string = '';

  dateControl = new FormControl();
  dateControlClose = new FormControl();

  public filteredDataShare: any = 'Hello from Parent!';

  resetTabToFirst(): void {
    this.tabIndex = 0; // Set the first tab as selected
    console.log('Tab index reset to:', this.tabIndex);
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    if (this.logoClickSubscription) {
      this.logoClickSubscription.unsubscribe();
    }
  }

  removeFilter(filterType: string, value?: string) {
    console.log('Removing filter:', filterType);
    switch (filterType) {
      case 'status':
        this.selectedCaseStatus = ''; // Clear case status filter
        delete this.payload.case_status;
        this.fetchData();
        break;

      case 'litigationVenues':
        if (value) {
          this.selectedSources.delete(value); // Remove specific source filter
          this.payload.litigation_venues = Array.from(this.selectedSources);
          this.fetchData();
        }
        break;

      case 'caseHistory':
        this.yearValueSelected = undefined; // Clear case history filter
        this.valueSlider = 0;
        this.payload.filed_date_list = [];
        this.fetchData();
        break;

      case 'caseFilledDate':
        // Clear case filled date range
        this.selectedFilledStartDate = null;
        this.selectedFilledEndDate = null;
        this.caseFilledDateArrays = [];
        this.resetDate();
        this.payload.filed_date_list = [];
        this.fetchData();
        break;

      case 'caseClosedDate':
        // Clear case close date range
        this.selectedClosedStartDate = null;
        this.selectedClosedEndDate = null;
        this.caseClosedDateArrays = [];
        this.resetDateClose();
        this.payload.case_closed_data_list = [];
        this.fetchData();
        break;

      case 'caseNumber':
        if (value) {
          this.removeCaseNo(value);
        }
        break;

      case 'plaintiffOrPetitioner':
        if (value) {
          this.removePlaintiff(value);
          // this.clearPlaintiffSearch();
        }
        break;

      case 'defendant':
        if (value) {
          this.removeDefandant(value);
        }
        break;

      case 'industry':
        if (value) {
          // this.selectedIndustry.delete(value);
          this.removeIndustry(value);
        }
        break;

      case 'techCategory':
        if (value) {
          // this.selectedTechCategory.delete(value);
          this.removeCategory(value);
        }
        break;

      case 'technologyKeywords':
        if (value) {
          // this.selectedTechnologyKeywords.delete(value);
          // this.clearTechnologyKeywordsSearch();
          this.removeKeyword(value);
        }
        break;

      case 'courtNames':
        if (value) {
          // this.selectedCourtName.delete(value);
          this.removeCourt(value);
        }
        break;

      case 'acquiredPatentOrOrganicPatent':
        this.selectedAcquisitionType = '';
        this.payload.acquisition_type = '';
        this.fetchData();
        break;

      case 'typeOfPatent':
        this.selectedPatentType = '';
        this.payload.patent_type = '';
        this.fetchData();
        break;

      case 'patentNo':
        if (value) {
          this.removePatentNo(value);
        }
        break;

      case 'causeOfAction':
        if (value) {
          this.removeactions(value);
        }
        break;

      case 'standardEssentialPatent':
        if (value) {
          this.selectedStandardPatent = '';
          this.payload.standard_patent = '';
          this.fetchData();
        }
        break;

      case 'semiconductorPatent':
        if (value) {
          this.selectedSemiconductorpatent = '';
          this.payload.semiconductor_patent = '';
          this.fetchData();
        }
        break;

      // Add any other filter removal logic here
    }

    // Re-apply the filters after removing the specific one
    this.applyFilters();
  }

  filterDataForAnalytics!: any;

  async fetchAndMergeAnalyticsData(): Promise<void> {
    try {
      const collectionNames = [
        'excelDataPrimary',
        'excelDataHigh',
        'excelDataMedium',
        'excelDataLow',
      ]; // Replace with your collection names

      const allDataPromises = collectionNames.map(async (collectionName) => {
        const collectionRef = collection(this.firestore, collectionName);

        // Add a limit to the query
        const limitedQuery = query(collectionRef, limit(10));

        const querySnapshot = await getDocs(limitedQuery);

        return querySnapshot.docs.map((doc, index) => ({
          id: doc.id, // Firestore document ID
          ...doc.data(), // Document data
          collection: collectionName, // Add collection name for reference
          srNo: index + 1, // Add serial number within the collection
        }));
      });

      // Wait for all data to be fetched and merged
      const allData = (await Promise.all(allDataPromises)).flat();

      console.log('Merged Data from All Collections:', allData);

      // Pass the merged data for preparation
      this.prepareAnalyticsData(allData);
    } catch (error) {
      console.error('Error fetching and merging data from collections:', error);
    }
  }

  prepareAnalyticsData(result: any): void {
    this.filterDataForAnalytics = result;
    console.log('Filtered Data for Analytics:', this.filterDataForAnalytics);

    this.excelData2 = Object.values(result).map((item: any, index) => ({
      ...item,
      data: {
        ...item.data, // Preserve the existing data
        srNo: index + 1, // Add srNo for the merged data
      },
    }));

    console.log('Prepared Excel Data:', this.excelData);
  }

  resetDate() {
    this.dateControl.reset(); // Clears the date picker value
  }
  resetDateClose() {
    this.dateControlClose.reset(); // Clears the date picker value
  }

  // Logic for search functionality

  onSearchInputTextOld(searchText: string) {
    const lowerCaseTerm = searchText.toLowerCase();
    this.filteredSearchInputData = [];

    this.excelData.forEach((item) => {
      const data = item.data;

      // Search in Case Details
      if (
        typeof data.caseDetails?.caseName === 'string' &&
        data.caseDetails.caseName.toLowerCase().includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(data.caseDetails.caseName);
      }
      if (
        typeof data.caseDetails?.caseNumber === 'string' &&
        data.caseDetails.caseNumber.toLowerCase().includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(data.caseDetails.caseNumber);
      }
      if (
        typeof data.caseDetails?.courtNames === 'string' &&
        data.caseDetails.courtNames.toLowerCase().includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(data.caseDetails.courtNames);
      }
      if (
        typeof data.caseDetails?.litigationVenues === 'string' &&
        data.caseDetails.litigationVenues.toLowerCase().includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(data.caseDetails.litigationVenues);
      }

      // Search in Patent Details
      if (
        typeof data.patentDetails?.techCategory === 'string' &&
        data.patentDetails.techCategory.toLowerCase().includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(data.patentDetails.techCategory);
      }
      if (
        typeof data.patentDetails?.patentNo === 'string' &&
        data.patentDetails.patentNo.toLowerCase().includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(data.patentDetails.patentNo);
      }
      if (
        typeof data.patentDetails?.technologyKeywords === 'string' &&
        data.patentDetails.technologyKeywords
          .toLowerCase()
          .includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(
          data.patentDetails.technologyKeywords
        );
      }

      // Search in Administrative Details
      if (
        typeof data.administrativeDetails?.typeOfPatent === 'string' &&
        data.administrativeDetails.typeOfPatent
          .toLowerCase()
          .includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(
          data.administrativeDetails.typeOfPatent
        );
      }

      // Search in Legal Entities
      if (
        typeof data.legalEntities?.plaintiffOrPetitioner === 'string' &&
        data.legalEntities.plaintiffOrPetitioner
          .toLowerCase()
          .includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(
          data.legalEntities.plaintiffOrPetitioner
        );
      }
      if (
        typeof data.legalEntities?.defendant === 'string' &&
        data.legalEntities.defendant.toLowerCase().includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(data.legalEntities.defendant);
      }

      // Search in Miscellaneous Fields
      if (
        typeof data.industry === 'string' &&
        data.industry.toLowerCase().includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(data.industry);
      }
      if (
        typeof data.standardEssentialPatent === 'string' &&
        data.standardEssentialPatent.toLowerCase().includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(data.standardEssentialPatent);
      }
      if (
        typeof data.semiconductorPatent === 'string' &&
        data.semiconductorPatent.toLowerCase().includes(lowerCaseTerm)
      ) {
        this.filteredSearchInputData.push(data.semiconductorPatent);
      }
    });

    // Remove duplicates
    this.filteredSearchInputData = Array.from(
      new Set(this.filteredSearchInputData)
    );
  }

  clearSearchTextInput() {
    try {
      this.searchInputText = ''; // Reset search input text
      this.payload.case_name = '';
      this.payload.case_no = '';
      this.fetchData();
      this.filteredSearchInputData = []; // Clear any filtered data
      this.isFiltering = false; // Reset filtering flag
      this.isLoadingSuggestions = false; // Stop any loading indication
      console.log(this.excelData);

      // Reset the data source to original data
      this.dataSource.data = [...this.excelData];

      // Trigger change detection to update the UI
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error while clearing search input:', error);
    }
  }

  onSearchSelected(caseNumber: string) {
    // console.log('Selected Case Number:', caseNumber);

    const selectedData = this.options.filter(
      (val) => val.data.caseNumber === caseNumber
    );
    // console.log(selectedData)
    this.dataSource.data = selectedData;
    // console.log(this.dataSource.data)
  }

  //get all unique industry name
  getAllIndustry() {
    const values = this.uniqueList('dataSource.data?.industry');
    this.industryArrays = values;
    console.log(this.industryArrays, 'fdgs');
    return values;
  }

  formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0]; // Convert to 'YYYY-MM-DD'
  }
  // Case Filled Date
  incrementDateByOne(date: any) {
    const newDate = new Date(date); // Create a new Date object
    newDate.setDate(newDate.getDate() + 1); // Increment the day
    return newDate;
  }
  getAllCaseFilledDate(dateRangeInput: any) {
    const startDate = dateRangeInput.value.start;
    const endDate = dateRangeInput.value.end;

    console.log(
      'Filled Start Date:',
      this.formatDateISO(this.incrementDateByOne(startDate))
    );
    console.log(
      'Filled FilledEnd Date:',
      this.formatDateISO(this.incrementDateByOne(endDate))
    );
    this.payload.filed_date_list = [];
    this.payload.filed_date_list.push(
      this.formatDateISO(this.incrementDateByOne(startDate))
    );
    this.payload.filed_date_list.push(
      this.formatDateISO(this.incrementDateByOne(endDate))
    );
    this.fetchData();
    const values = this.uniqueList('caseDetails.caseComplaintDate');
    console.log('filled uniqueList' + values);
    const caseFilledDateArrays: Date[] = [];
    values.forEach((res) => {
      console.log(res);

      if (res) {
        const convertedDate = this.convertToDate(res);
        if (
          convertedDate &&
          convertedDate < endDate &&
          convertedDate > startDate
        ) {
          caseFilledDateArrays.push(convertedDate);
        }
      }
    });
    console.log(caseFilledDateArrays);

    // Store the selected date range
    this.selectedFilledStartDate = startDate;
    this.selectedFilledEndDate = endDate;

    this.onCaseFilledDate(caseFilledDateArrays);
  }

  getAllCaseClosedDate(dateRangeInputClosedDate: any) {
    const startDate = dateRangeInputClosedDate.value.start;
    const endDate = dateRangeInputClosedDate.value.end;
    console.log(
      'Closed Start Date:',
      this.formatDateISO(this.incrementDateByOne(startDate))
    );
    console.log(
      'Closed FilledEnd Date:',
      this.formatDateISO(this.incrementDateByOne(endDate))
    );
    this.payload.case_closed_data_list = [];
    this.payload.case_closed_data_list.push(
      this.formatDateISO(this.incrementDateByOne(startDate))
    );
    this.payload.case_closed_data_list.push(
      this.formatDateISO(this.incrementDateByOne(endDate))
    );
    this.fetchData();

    const values = this.uniqueList('caseDetails.caseClosedDate');
    const caseClosedDateArrays: Date[] = [];
    values.forEach((res) => {
      console.log(res);
      if (res) {
        const convertedDate = this.convertToDate(res);
        if (
          convertedDate &&
          convertedDate < endDate &&
          convertedDate > startDate
        ) {
          caseClosedDateArrays.push(convertedDate);
        }
      }
    });
    console.log(caseClosedDateArrays);

    // Store the selected date range
    this.selectedClosedStartDate = startDate;
    this.selectedClosedEndDate = endDate;

    this.onCaseClosedDate(caseClosedDateArrays);
  }

  getAllAcquisitionType() {
    const values = this.uniqueList(
      'patentDetails.acquiredPatentOrOrganicPatent'
    );
    return values;
  }

  getAllPatentType() {
    const values = this.uniqueList('administrativeDetails.typeOfPatent');
    return values;
  }

  uniqueList<T = any>(key: string): T[] {
    const extractedValues: T[] = this.excelData.map((item) => {
      // Dynamically access nested keys
      const keys = key.split('.');
      let value: any = item.data; // Start with the `data` field
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined || value === null) break; // Stop if undefined or null
      }
      return value;
    });

    // Remove duplicates and return
    return extractedValues.filter(
      (value, index, self) =>
        value !== undefined &&
        value !== null &&
        self.findIndex((v) => JSON.stringify(v) === JSON.stringify(value)) ===
          index
    );
  }

  applyFilters() {
    let filteredData = this.excelData;
    const currentDate = new Date();

    // Utility function to check for "All"
    const isAllSelected = (selected: string) =>
      selected === '' || selected === 'All';

    // Apply source filter (checkboxes)
    if (this.selectedSources.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedSources.has(val.data.caseDetails.litigationVenues)
      );
    }

    // Apply Industry filter (checkboxes)
    if (this.selectedIndustry.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedIndustry.has(val.data.industry)
      );
    }

    // Apply Tech Category filter (checkboxes)
    if (this.selectedTechCategory.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedTechCategory.has(val.data.patentDetails.techCategory)
      );
    }

    // Apply Tech Court Name filter (checkboxes)
    if (this.selectedCourtName.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedCourtName.has(val.data.caseDetails.courtNames)
      );
    }

    // Apply Tech Court Number filter.
    if (this.selectedCaseNumbers.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedCaseNumbers.has(val.data.caseNumber)
      );
    }

    // Apply plaintiffOrPetitioner filter.
    if (this.selectedPlaintiff.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedPlaintiff.has(val.data.legalEntities.plaintiffOrPetitioner)
      );
    }

    // Apply Tech Defendant filter.
    if (this.selectedDefendant.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedDefendant.has(val.data.legalEntities.defendant)
      );
    }

    // Apply Tech Defendant filter.
    if (this.selectedTechnologyKeywords.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedTechnologyKeywords.has(
          val.data.patentDetails.technologyKeywords
        )
      );
    }

    // Apply Patent No. filter.
    if (this.selectedpatentNo.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedpatentNo.has(val.data.patentNo)
      );
    }

    // Apply CauseOfAction filter.
    if (this.selectedCauseOfAction.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedCauseOfAction.has(val.data.causeOfAction)
      );
    }

    // Apply standardEssentialPatent filter.
    if (this.selectedStandardEssentialPatent.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedStandardEssentialPatent.has(
          val.data.standardEssentialPatent
        )
      );
    }

    // Apply semiconductorPatent filter.
    if (this.selectedSemiconductorPatent.size > 0) {
      filteredData = filteredData.filter((val) =>
        this.selectedSemiconductorPatent.has(val.data.semiconductorPatent)
      );
    }

    // Apply year slider filter
    if (this.yearValueSelected !== undefined) {
      filteredData = filteredData.filter((val) => {
        const caseDate: any = this.convertToDate(
          val.data.caseDetails.caseComplaintDate
        );
        const yearsDifference = this.calculateYearsDifference(
          caseDate,
          currentDate
        );
        if (yearsDifference >= 0) {
          return yearsDifference <= this.yearValueSelected;
        } else {
          console.log(`Skipping future date: ${caseDate}`);
          return false;
        }
      });
    }

    // Apply date range filters
    // const applyDateFilters = (dateArrays: Date[], dateField: string) => {
    //   return filteredData.filter((val) => {
    //     const caseDate: any = this.convertToDate(val.data[dateField]);
    //     return dateArrays.some((date) => date.getTime() === caseDate.getTime());
    //   });
    // };

    if (this.caseFilledDateArrays.length > 0) {
      filteredData = filteredData.filter((item) =>
        this.caseFilledDateArrays.some(
          (date) =>
            date.getTime() ===
            this.convertToDate(
              item.data.caseDetails.caseComplaintDate
            )?.getTime()
        )
      );
    }

    // if (this.caseClosedDateArrays.length > 0) {
    //   filteredData = applyDateFilters(
    //     this.caseClosedDateArrays,
    //     'caseDetails.caseClosedDate'
    //   );
    // }

    if (this.caseClosedDateArrays.length > 0) {
      console.log('this runs', this.caseClosedDateArrays);

      filteredData = filteredData.filter((item) =>
        this.caseClosedDateArrays.some(
          (date) =>
            date.getTime() ===
            this.convertToDate(item.data.caseDetails.caseClosedDate)?.getTime()
        )
      );
    }

    // Apply selectedCaseStatus filter
    if (this.selectedCaseStatus && !isAllSelected(this.selectedCaseStatus)) {
      filteredData = filteredData.filter(
        (val) => val.data.caseDetails.status === this.selectedCaseStatus
      );
    }

    // Apply selectedAcquisitionType filter
    if (
      this.selectedAcquisitionType &&
      !isAllSelected(this.selectedAcquisitionType)
    ) {
      filteredData = filteredData.filter((val) =>
        this.selectedAcquisitionType.includes(
          val.data.acquiredPatentOrOrganicPatent
        )
      );
    }

    // Apply selectedPatentType filter
    if (this.selectedPatentType && !isAllSelected(this.selectedPatentType)) {
      filteredData = filteredData.filter((val) =>
        this.selectedPatentType.includes(val.data.typeOfPatent)
      );
    }

    // Apply caseNumber filter
    // if (this.caseNumberInputValue?.trim()) {
    //     filteredData = filteredData.filter(val =>
    //         val.data.caseNumber === this.caseNumberInputValue
    //     );
    // }

    // Apply plaintiff filter
    // if (this.plaintiffInputValue?.trim()) {
    //     filteredData = filteredData.filter(val =>
    //         this.plaintiffInputValue.includes(val.data.plaintiffOrPetitioner)
    //     );
    // }

    // Apply defendant filter
    // if (this.defendantInputValue?.trim()) {
    //     filteredData = filteredData.filter(val =>
    //         this.defendantInputValue.includes(val.data.defendant)
    //     );
    // }

    // Update data source
    console.log(filteredData.length);
    this.dataSource.data = filteredData;

    console.log('Filtered data:', filteredData);
  }

  // function for  selectedPlaintiff
  filterPlaintiff() {
    const searchTerm = this.plaintiffInputValue.toLowerCase(); // Get the input value
    console.log();
    this.filteredPlaintiff = this.plaintiffArrays.filter(
      (Plaintiff) => Plaintiff.toLowerCase().includes(searchTerm) // Filter based on the input
    );
  }

  selectPlaintiff(plaintiff: string) {
    if (!this.selectedPlaintiff.has(plaintiff)) {
      this.selectedPlaintiff.add(plaintiff); // Add to selection if not already selected
      this.payload.plaintiff = Array.from(this.selectedPlaintiff);
      this.fetchData();
    }
    this.plaintiffInputValue = '';
    console.log(
      'Currently selected plaintiff:',
      Array.from(this.selectedPlaintiff)
    );
    this.applyFilters();
  }

  removePlaintiff(plaintiff: string) {
    this.selectedPlaintiff.delete(plaintiff);
    this.payload.plaintiff = Array.from(this.selectedPlaintiff);
    this.fetchData();
  }

  removeDefandant(defendant: string) {
    this.selectedDefendant.delete(defendant);
    this.payload.defendants = Array.from(this.selectedDefendant);
    this.fetchData();
  }

  selectDefendant(defendant: string) {
    if (!this.selectedDefendant.has(defendant)) {
      this.selectedDefendant.add(defendant); // Add to selection if not already selected
      this.payload.defendants = Array.from(this.selectedDefendant);
      this.fetchData();
    }
    this.defendantInputValue = '';
    console.log(
      'defendant selected plaintiff:',
      Array.from(this.selectedDefendant)
    );
    this.applyFilters();
  }

  // function for  selectedTechnologyKeywords
  filterTechnologyKeywords() {
    const searchTerm = this.technologyKeywordInputValue
      ? this.technologyKeywordInputValue.toLowerCase()
      : '';

    // Flatten all keywords into a single array
    // const allKeywords = this.technologyKeywordsArrays
    //   .map(
    //     (keywords) =>
    //       keywords.split(',').map((keyword) => keyword.trim().toLowerCase()) // Normalize case and trim
    //   )
    //   .flat();

    // Filter and remove duplicates
    this.filteredTechnologyKeywords = Array.from(
      new Set(
        this.technologyKeywordsArrays.filter((keyword) =>
          keyword.includes(searchTerm)
        )
      )
    );
  }

  onTechnologyKeywordChanged(keyword: string, isChecked: boolean) {
    if (isChecked) {
      this.selectedTechnologyKeywords.add(keyword); // Add to the set if checked
    } else {
      this.selectedTechnologyKeywords.delete(keyword); // Remove from the set if unchecked
    }
    this.payload.tech_keyword = Array.from(this.selectedTechnologyKeywords);
    this.fetchData();
    // this.updateDataSource(); // Update the dataSource based on the selected keywords
  }

  removeKeyword(keyword: string) {
    this.selectedTechnologyKeywords.delete(keyword);
    this.payload.tech_keyword = Array.from(this.selectedTechnologyKeywords);
    this.fetchData();
  }

  updateDataSource() {
    const selectedKeywords = Array.from(this.selectedTechnologyKeywords);
    console.log('Selected Keywords:', selectedKeywords);

    if (selectedKeywords.length > 0) {
      this.dataSource.data = this.excelData.filter((item) => {
        // Safeguard against null or undefined fields
        const keywords = item.data?.patentDetails?.technologyKeywords || '';
        if (!keywords) return false;

        // Split and normalize keywords for matching
        const keywordsArray = keywords
          .split(',')
          .map((kw: any) => kw.trim().toLowerCase());
        return selectedKeywords.some((keyword) =>
          keywordsArray.includes(keyword.toLowerCase())
        );
      });
    } else {
      this.applyFilters();
    }
  }

  selectPatentNo(patentNo: string) {
    if (!this.selectedpatentNo.has(patentNo)) {
      this.selectedpatentNo.add(patentNo); // Add to selection if not already selected
      this.payload.patent_no = Array.from(this.selectedpatentNo);
      this.fetchData();
    }
    this.patentNoInputValue = '';
    console.log(
      'patentNo selected technologyKeywords:',
      Array.from(this.selectedpatentNo)
    );
    this.applyFilters();
  }

  selectCauseOfAction(causeOfAction: string) {
    if (!this.selectedCauseOfAction.has(causeOfAction)) {
      this.selectedCauseOfAction.add(causeOfAction); // Add to selection if not already selected
      this.payload.causeOfaction = Array.from(this.selectedCauseOfAction);
      this.fetchData();
    }
    console.log(
      'causeOfAction selected causeOfAction:',
      Array.from(this.selectedCauseOfAction)
    );
    this.applyFilters();
  }

  removeactions(action: string) {
    this.selectedCauseOfAction.delete(action);
    this.payload.causeOfaction = Array.from(this.selectedCauseOfAction);
    this.fetchData();
  }

  // function for  selected standardEssentialPatent
  filterStandardEssentialPatent() {
    const searchTerm = this.standardEssentialPatentInputValue.toLowerCase(); // Get the input value
    this.filteredStandardEssentialPatents =
      this.standardEssentialPatentArrays.filter(
        (standardEssentialPatent) =>
          standardEssentialPatent.toLowerCase().includes(searchTerm) // Filter based on the input
      );
  }

  selectStandardEssentialPatent(standardEssentialPatent: string) {
    if (!this.selectedStandardEssentialPatent.has(standardEssentialPatent)) {
      this.selectedStandardEssentialPatent.add(standardEssentialPatent); // Add to selection if not already selected
    }
    console.log(
      'standardEssentialPatent selected standardEssentialPatent:',
      Array.from(this.selectedStandardEssentialPatent)
    );
    this.applyFilters();
  }

  // function for  selected semiconductorPatent
  filterSemiconductorPatent() {
    const searchTerm = this.semiconductorPatentInputValue.toLowerCase(); // Get the input value
    this.filteredSemiconductorPatents = this.semiconductorPatentArrays.filter(
      (semiconductorPatent) =>
        semiconductorPatent.toLowerCase().includes(searchTerm) // Filter based on the input
    );
  }

  selectSemiconductorPatent(semiconductorPatent: string) {
    if (!this.selectedSemiconductorPatent.has(semiconductorPatent)) {
      this.selectedSemiconductorPatent.add(semiconductorPatent); // Add to selection if not already selected
    }
    console.log(
      'semiconductorPatent selected semiconductorPatent:',
      Array.from(this.selectedSemiconductorPatent)
    );
    this.applyFilters();
  }

  removeCaseNo(no: string) {
    this.selectedCaseNumbers.delete(no); // Add to selection if not already selected
    this.payload.case_no = Array.from(this.selectedCaseNumbers);
    this.fetchData();
  }

  // function for  selectedCaseNumber
  filterCaseNumbers() {
    const searchTerm = this.caseNumberInputValue.toLowerCase(); // Get the input value
    this.filteredCaseNumbers = this.caseNumbers.filter(
      (caseNumber) => caseNumber.toLowerCase().includes(searchTerm) // Filter based on the input
    );
  }

  selectCaseNumber(caseNo: string) {
    console.log(caseNo);
    if (!this.selectedCaseNumbers.has(caseNo)) {
      this.selectedCaseNumbers.add(caseNo); // Add to selection if not already selected
      this.payload.case_no = Array.from(this.selectedCaseNumbers);
      this.fetchData();
    }
    this.caseNumberInputValue = '';
    console.log(
      'Currently selected case numbers:',
      Array.from(this.selectedCaseNumbers)
    );
    this.applyFilters();
  }

  // function for  selectedIndustry
  filterIndustry() {
    const searchTerm = this.industryInputValue.toLowerCase(); // Get the input value
    this.filteredIndustry = this.industryArrays.filter(
      (industry) => industry.toLowerCase().includes(searchTerm) // Filter based on the input
    );
  }

  selectIndustry(industry: string) {
    this.selectedIndustry.add(industry); // Add selected industry
    this.industryInputValue = ''; // Clear input after selection
    this.filteredIndustry = this.industryArrays; // Reset filtered list
  }

  removeIndustry(industry: string) {
    this.selectedIndustry.delete(industry); // Remove selected industry
  }

  onCheckboxIndustryChange(isChecked: boolean, industry: string) {
    if (isChecked) {
      this.selectedIndustry.add(industry); // Add to selection
    } else {
      this.selectedIndustry.delete(industry); // Remove from selection
    }
    this.payload.industry = Array.from(this.selectedIndustry);
    this.fetchData();
    console.log('Selected Industries:', Array.from(this.selectedIndustry));
    this.applyFilters();
  }

  removeCategory(category: string) {
    this.selectedTechCategory.delete(category);
    this.payload.tech_category = Array.from(this.selectedTechCategory);
    this.fetchData();
  }
  // function for  selectedTechCategory
  filterTechCategory() {
    const searchTerm = this.techCategoryInputValue.toLowerCase(); // Get the input value
    this.filteredTechCategory = this.techCategoryArrays.filter(
      (techCategory) => techCategory.toLowerCase().includes(searchTerm) // Filter based on the input
    );
  }

  onCheckboxTechCategoryChange(isChecked: boolean, techCategory: string) {
    if (isChecked) {
      this.selectedTechCategory.add(techCategory); // Add to selection
    } else {
      this.selectedTechCategory.delete(techCategory); // Remove from selection
    }
    this.payload.tech_category = Array.from(this.selectedTechCategory);
    this.fetchData();
    this.applyFilters();
  }

  removeCourt(court: string) {
    this.selectedCourtName.delete(court);
    this.payload.court_name = Array.from(this.selectedCourtName);
    this.fetchData();
  }

  // function for  selectedCourtName
  filterCourtName() {
    const searchTerm = this.courtNameInputValue.toLowerCase(); // Get the input value
    this.filteredCourtName = this.courtNameArrays.filter(
      (courtName) => courtName.toLowerCase().includes(searchTerm) // Filter based on the input
    );
  }

  onCheckboxCourtNameChange(isChecked: boolean, courtName: string) {
    if (isChecked) {
      this.selectedCourtName.add(courtName); // Add to selection
    } else {
      this.selectedCourtName.delete(courtName); // Remove from selection
    }
    this.payload.court_name = Array.from(this.selectedCourtName);
    this.fetchData();
    this.applyFilters();
  }

  onYearSliderChange(yearValueSelected: number) {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setFullYear(today.getFullYear() - yearValueSelected);
    // Format the dates as ISO strings (or customize as needed)
    const startDate = pastDate.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    if (yearValueSelected === 0) {
      this.payload.filed_date_list = [];
    } else {
      this.payload.filed_date_list = [];
      this.payload.filed_date_list.push(startDate);
      this.payload.filed_date_list.push(endDate);
    }
    this.fetchData();
    console.log('Selected Date Range:', { startDate, endDate });

    console.log(yearValueSelected);
    this.yearValueSelected = yearValueSelected;
    this.applyFilters();
  }

  onCaseFilledDate(caseFilledDateArrays: Date[]) {
    this.caseFilledDateArrays = caseFilledDateArrays;
    this.applyFilters();
  }

  onCaseClosedDate(caseClosedDateArrays: Date[]) {
    this.caseClosedDateArrays = caseClosedDateArrays;
    this.applyFilters();
  }

  onAcquisitionTypeChange(acquisitionType: string, isChecked: boolean) {
    if (isChecked) {
      this.selectedAcquisitionType = acquisitionType; // Set the selected acquisition type
    } else {
      this.selectedAcquisitionType = ''; // Clear the selected acquisition type
    }
    this.payload.acquisition_type = this.selectedAcquisitionType;
    this.fetchData();
    // Filter data directly based on acquisition type

    this.applyFilters(); // Apply general filters if no acquisition type is selected
  }

  onPatentTypeChange() {
    if (this.selectedPatentType === 'All') {
      this.selectedPatentType = ''; // Clear filter if "All" is selected
    }

    console.log('Selected Patent Type:', this.selectedPatentType);
    this.payload.patent_type = this.selectedPatentType;
    this.fetchData();
    this.applyFilters();
  }

  onStandardPatentChange() {
    if (this.selectedStandardPatent === 'All') {
      this.selectedStandardPatent = ''; // Clear filter if "All" is selected
    }

    console.log('Selected Patent Type:', this.selectedStandardPatent);
    this.payload.standard_patent = this.selectedStandardPatent;
    this.fetchData();
    this.applyFilters();
  }

  onSemiconductorPatentChange() {
    if (this.selectedSemiconductorpatent === 'All') {
      this.selectedSemiconductorpatent = ''; // Clear filter if "All" is selected
    }

    console.log('Selected Patent Type:', this.selectedSemiconductorpatent);
    this.payload.semiconductor_patent = this.selectedSemiconductorpatent;
    this.fetchData();
    this.applyFilters();
  }

  onSelectCaseNumber(caseDetails: any): void {
    console.log('Selected case details:', caseDetails);
    this.api.updateSelectedCase(caseDetails); // Push data to the subject
    // this.router.navigate(['case-list']); // Navigate to the case-list page
    this.router.navigate(['case-list'], {
      queryParams: { caseno: caseDetails },
    });
  }

  convertToDate(timestamp: any): Date | null {
    // Check for Firestore Timestamp object
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000); // Convert seconds to milliseconds
    }

    // Check for UNIX timestamp in seconds or milliseconds
    if (typeof timestamp === 'number') {
      // Detect if it's in seconds or milliseconds
      const date = new Date(
        timestamp > 9999999999 ? timestamp : timestamp * 1000
      );
      return isNaN(date.getTime()) ? null : date;
    }

    // Check for ISO date string
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }

    // If the format is invalid or null
    console.warn('Invalid or unsupported timestamp format:', timestamp);
    return null;
  }

  formatDate(date: Date | null): string {
    if (!date) return '';

    const day = date.getDate(); // No need to pad single-digit days
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month}, ${year}`;
  }

  toggleIcon() {
    this.menuIcon = !this.menuIcon;
  }

  calculateYearsDifference(fromDate: Date | null, toDate: Date | null): number {
    if (!fromDate || !toDate) {
      console.error('Invalid date(s) provided:', { fromDate, toDate });
      return 0; // Return 0 or any fallback value for invalid dates
    }

    const yearsDifference = toDate.getFullYear() - fromDate.getFullYear();

    const isEarlierInYear =
      toDate.getMonth() < fromDate.getMonth() ||
      (toDate.getMonth() === fromDate.getMonth() &&
        toDate.getDate() < fromDate.getDate());

    return isEarlierInYear ? yearsDifference - 1 : yearsDifference;
  }

  // Method to get file type from URL
  getFileType(url: any): any {
    console.log(url);
    // return  this.authService.getFileTypeFromUrl(url);
  }

  getFirstFileByExtension(files: string[], extension: string): string | null {
    if (!files || files.length === 0) return null;

    // Filter files by extension
    const matchingFile = files.find((file) =>
      file.toLowerCase().endsWith(`.${extension}`)
    );

    // Return the matching file URL if found, otherwise null
    return matchingFile || null;
  }

  getFileTypeByExtension(fileName: string): string {
    console.log(fileName);
    const extension = fileName.split('.').pop()?.toLowerCase(); // Get the last part after the dot
    console.log(extension);
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'xls':
      case 'xlsx':
        return 'Excel';
      default:
        return 'Unknown';
    }
  }

  filterUpfileByDocId(docId: string): any[] {
    return this.excelData.filter((file) => file.docId === docId);
  }

  onSearchCaseNumber() {
    const lowerCaseTerm = this.caseNumberInputValue.toLowerCase();
    this.filteredSearchInputData = [];
    this.excelData.forEach((item) => {
      if (item.data.caseNumber.toLowerCase().includes(lowerCaseTerm)) {
        this.filteredSearchInputData.push(item.data.caseNumber); // Add the caseName if it matches
      }
    });
  }

  // Logic for case number search
  onSearchCaseNumberInput(caseNumberText: string) {
    const lowerCaseTerm = caseNumberText.toLowerCase();
    this.filteredCaseNumbers = [];
    this.filteredCaseNumbers = this.caseNumbers.filter((item) =>
      item.toLowerCase().includes(lowerCaseTerm)
    );
    // Remove duplicates
    this.filteredCaseNumbers = Array.from(new Set(this.filteredCaseNumbers));
  }
  // Select case number
  onCaseNumberSelected(caseNumber: string) {
    this.caseNumberInputValue = caseNumber;
    this.payload.case_no = caseNumber;
    this.fetchData();
    // Filter the table data to show only the selected case number
    this.dataSource.data = this.excelData.filter(
      (item) => item.data.caseDetails?.caseNumber === caseNumber
    );

    console.log(`Selected Case Number: ${caseNumber}`);
  }

  // Clear the search box for case number
  clearSearchCaseNumber() {
    // this.removeFilter('caseNumber',this.caseNumberInputValue);
    this.caseNumberInputValue = '';
    this.payload.case_no = '';
    this.fetchData();
    this.filteredCaseNumbers = [];
    this.selectedCaseNumbers.clear();
    this.applyFilters();
  }

  // Logic for searching Plaintiffs
  onSearchPlaintiffInput(plaintiffText: string) {
    const lowerCaseTerm = plaintiffText.toLowerCase();
    this.filteredPlaintiff = this.plaintiffArrays.filter((item) =>
      item.toLowerCase().includes(lowerCaseTerm)
    );

    // Remove duplicates based on plaintiff and caseNumber combination
    // this.filteredPlaintiff = Array.from(
    //   new Set(this.filteredPlaintiff.map((item) => JSON.stringify(item)))
    // ).map((item) => JSON.parse(item));
  }

  // Select plaintiff
  onPlaintiffSelected(plaintiff: string) {
    this.payload.plaintiff = plaintiff;
    this.fetchData();
    this.dataSource.data = this.excelData.filter((item) =>
      item.data.legalEntities?.plaintiffOrPetitioner
        ?.toLowerCase()
        .includes(plaintiff.toLowerCase())
    );
    console.log(`Selected Plaintiff Company: ${plaintiff}`);
  }

  // Clear the search box for plaintiff
  clearPlaintiffSearch() {
    this.payload.plaintiff = '';
    this.fetchData();
    this.plaintiffInputValue = '';
    this.filteredPlaintiff = [];
    this.selectedPlaintiff.clear();
    this.applyFilters();
  }

  // Logic for searching Defendants
  onSearchDefendantInput(defendantText: string) {
    const lowerCaseTerm = defendantText.toLowerCase();

    this.filteredDefendants = this.defendantArrays.filter((item) =>
      item.toLowerCase().includes(lowerCaseTerm)
    );

    // Remove duplicates based on defendant and caseNumber combination
    // this.filteredDefendants = Array.from(
    //   new Set(this.filteredDefendants.map((item) => JSON.stringify(item)))
    // ).map((item) => JSON.parse(item));
  }

  onDefendantSelected(defendant: string) {
    this.defendantInputValue = defendant;
    this.payload.defendants = defendant;
    this.fetchData();
    // Filter the table based on the selected defendant
    this.dataSource.data = this.excelData.filter((item) =>
      item.data.legalEntities?.defendant
        ?.toLowerCase()
        .includes(defendant.toLowerCase())
    );

    // console.log(
    //   `Selected Defendant: ${defendant.defendant}, Case Number: ${defendant.caseNumber}`
    // );
  }

  // Clear the search box for defendant
  clearDefendantSearch() {
    this.payload.defendants = '';
    this.fetchData();
    this.defendantInputValue = '';
    this.filteredDefendants = [];
    this.selectedDefendant.clear();
    this.applyFilters();
  }

  // Select technology keyword
  onTechnologyKeywordSelected(keyword: string) {
    // Update the input value with the selected keyword
    this.technologyKeywordsInputValue = keyword;

    // Filter the table data to show only rows matching the selected technology keyword
    this.dataSource.data = this.excelData.filter(
      (item) =>
        item.data.patentDetails.technologyKeywords &&
        item.data.patentDetailstechnologyKeywords.includes(keyword)
    );

    console.log(`Selected Technology Keyword: ${keyword}`);
  }

  // Clear the search input
  clearTechnologyKeywordsSearch() {
    this.technologyKeywordInputValue = '';
    delete this.payload.tech_keyword;
    this.fetchData();
  }

  // Logic for searching Court Names
  onSearchCourtNamesInput(courtNameText: string) {
    const lowerCaseTerm = courtNameText.toLowerCase();
    this.filteredCourtName = this.courtNameArrays.filter((courtName) =>
      courtName?.toLowerCase().includes(lowerCaseTerm)
    );

    this.filteredCourtName = Array.from(new Set(this.filteredCourtName));
  }
  // Logic for selecting a court name

  onCourtNameSelected(event: any) {
    let courtName = event.value;
    this.courtNameInputValue = courtName; // Update the input field with the selected court name
    this.payload.court_name = this.selectedCourtNames;
    this.fetchData();
    // Optional: You can update your data source based on the selected court name if needed
    // const selectedData = this.excelData.filter(
    //   (item) => item.data.caseDetails.courtNames === courtName
    // );
    // this.dataSource.data = selectedData; // Update the data source or handle it as required
  }

  // Clear the search box for court names
  clearCourtNamesSearch() {
    this.courtNameInputValue = ''; // Reset the input value
    this.filteredCourtName = []; // Clear the suggestions
    delete this.payload.court_name;
    this.fetchData();
  }

  // Logic for searching Patent Number
  onSearchPatentNoInput(patentNoText: string) {
    const lowerCaseTerm = patentNoText.toLowerCase();
    this.filteredPatentNos = this.patentNoArrays.filter(
      (patentNo) => patentNo?.toLowerCase().includes(lowerCaseTerm) // Use optional chaining
    );

    // Remove duplicates
    this.filteredPatentNos = Array.from(new Set(this.filteredPatentNos));
  }

  // Select patent number
  // onPatentNoSelected(patentNo: string) {
  //   this.patentNoInputValue = patentNo; // Update the input field with the selected patent number

  //   this.payload.patent_no = patentNo;
  //   this.fetchData()

  // }
  removePatentNo(patentNo: string) {
    this.selectedpatentNo.delete(patentNo);
    this.payload.patent_no = Array.from(this.selectedpatentNo);
    this.fetchData();
  }

  // Clear the search box for patent numbers
  clearPatentNoSearch() {
    this.patentNoInputValue = ''; // Reset the input value
    // this.payload.patent_no = '';
    // this.fetchData();
    this.filteredPatentNos = []; // Clear the suggestions

    // Optionally reset the data source to show all data again
    this.dataSource.data = this.excelData; // Show all data if that's the desired behavior
  }

  // Logic for searching Cause of Action
  onSearchCauseOfActionInput(causeText: string) {
    const lowerCaseTerm = causeText.toLowerCase();
    this.filteredCauseOfActions = this.causeOfActionArrays.filter(
      (cause) => cause?.toLowerCase().includes(lowerCaseTerm) // Use optional chaining
    );

    // Remove duplicates
    this.filteredCauseOfActions = Array.from(
      new Set(this.filteredCauseOfActions)
    );
  }

  // Select cause of action
  onCauseOfActionSelected(cause: string) {
    this.causeOfActionInputValue = cause; // Update the input field with the selected cause of action
    this.payload.causeOfaction = cause;
    this.fetchData();
  }

  // Clear the search box for cause of action
  clearCauseOfActionSearch() {
    this.causeOfActionInputValue = ''; // Reset the input value
    this.filteredCauseOfActions = []; // Clear the suggestions
    this.payload.causeOfaction = '';
    this.fetchData();
    // Optionally reset the data source to show all data again
  }

  // Logic for searching Standard Essential Patent
  onSearchStandardEssentialPatentInput(patentText: string) {
    const lowerCaseTerm = patentText.toLowerCase();
    this.filteredStandardEssentialPatents = this.excelData
      .map((item) => item.data.standardEssentialPatent) // Get all standard essential patents
      .filter(
        (patent) => patent?.toLowerCase().includes(lowerCaseTerm) // Use optional chaining
      );

    // Remove duplicates
    this.filteredStandardEssentialPatents = Array.from(
      new Set(this.filteredStandardEssentialPatents)
    );
  }

  // Select standard essential patent
  onStandardEssentialPatentSelected(patent: string) {
    this.standardEssentialPatentInputValue = patent; // Update the input field with the selected patent

    // Optional: Update your data source based on the selected standard essential patent if needed
    const selectedData = this.excelData.filter(
      (item) => item.data.standardEssentialPatent === patent
    );
    this.dataSource.data = selectedData; // Update the data source or handle it as required
  }

  // Clear the search box for standard essential patents
  clearStandardEssentialPatentSearch() {
    this.standardEssentialPatentInputValue = ''; // Reset the input value
    this.filteredStandardEssentialPatents = []; // Clear the suggestions

    // Optionally reset the data source to show all data again
    this.dataSource.data = this.excelData; // Show all data if that's the desired behavior
  }

  // Logic for searching Semiconductor Patent
  onSearchSemiconductorPatentInput(patentText: string) {
    const lowerCaseTerm = patentText.toLowerCase();
    this.filteredSemiconductorPatents = this.excelData
      .map((item) => item.data.semiconductorPatent) // Get all semiconductor patents
      .filter(
        (patent) => patent?.toLowerCase().includes(lowerCaseTerm) // Use optional chaining
      );

    // Remove duplicates
    this.filteredSemiconductorPatents = Array.from(
      new Set(this.filteredSemiconductorPatents)
    );
  }

  // Select semiconductor patent
  onSemiconductorPatentSelected(patent: string) {
    this.semiconductorPatentInputValue = patent; // Update the input field with the selected patent

    // Optional: Update your data source based on the selected semiconductor patent if needed
    const selectedData = this.excelData.filter(
      (item) => item.data.semiconductorPatent === patent
    );
    this.dataSource.data = selectedData; // Update the data source or handle it as required
  }

  // Clear the search box for semiconductor patents
  clearSemiconductorPatentSearch() {
    this.semiconductorPatentInputValue = ''; // Reset the input value
    this.filteredSemiconductorPatents = []; // Clear the suggestions

    // Optionally reset the data source to show all data again
    this.dataSource.data = this.excelData; // Show all data if that's the desired behavior
  }
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[a.length][b.length];


  
}



function calculateSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  return ((maxLength - distance) / maxLength) * 100; // Similarity in percentage
}