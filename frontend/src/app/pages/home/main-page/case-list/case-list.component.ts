import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../../services/api.service';
import {
  ChartConfiguration,
  ChartData,
  ChartDataset,
  ChartEvent,
  ChartOptions 
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import 'chartjs-adapter-date-fns';
import { ExcelData } from '../../../admin/excelDataTpes-interface';
import { MatDialog } from '@angular/material/dialog';
import { PaymentDialogComponent } from '../../../../dialogs/payment-dialog/payment-dialog.component';
import { AuthService } from '../../../../services/auth.service';
import { ReportPaymentComponent } from '../../../../dialogs/report-payment/report-payment.component';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TimelineComponent } from '../../../timeline/timeline.component';
interface Point {
  x: number; // This will represent the year
  y: number; // This will represent the month
}

interface TimelineEvent {
  date: Date;
  label: string;
}

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [
    MatGridListModule,
    MatIconModule,
    DatePipe,
    CommonModule,
    BaseChartDirective,
    MatButtonModule,
    MatProgressSpinnerModule,
    TimelineComponent
  ],
  templateUrl: './case-list.component.html',
  styleUrls: ['./case-list.component.scss'],
})
export class CaseListComponent implements OnInit, OnChanges {
  @Input() caseNumberPass: any | null = null;
  errorMessage!: string;

  constructor(private dialog: MatDialog, private authService: AuthService,private route: ActivatedRoute) {}

  // @ViewChild(BaseChartDirective) chart!: BaseChartDirective; // Access the chart instance

  activity_timeline: any=[]
  caseData?: any;
  objectKeys = Object.keys;
  loader:any = false;
  assigneeTimelineData1:ChartData<'line'> = { labels: [], datasets: [] };
  chartOptions1: ChartOptions = {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Execution Date' } },
      y: { title: { display: true, text: 'Assignees' } }
    }
  };
  case:any={};
  timelineEvents: TimelineEvent[] = [];
  data: any=
      {
        "patent_no": 9026836,
        "assignments": [
          {
            "execution_date": "2012-05-18",
            "assignor": "Brunson, Gordon R.",
            "assignee": "Avaya Inc."
          },
          {
            "execution_date": "2012-12-21",
            "assignor": "Avaya, Inc.",
            "assignee": "The Bank Of New York Mellon Trust Company, N.A."
          },
          {
            "execution_date": "2013-03-07",
            "assignor": "Avaya, Inc.",
            "assignee": "Bank Of New York Mellon Trust Company, N.A., The"
          },
          {
            "execution_date": "2017-01-24",
            "assignor": "Avaya Inc.",
            "assignee": "Citibank, N.A., As Administrative Agent"
          },
        ]
      }
    

  public scatterChartLabels: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  chartLabels: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]; // For human-readable x-axis labels

  public scatterChartOptions: ChartConfiguration['options'] = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year',
        },
        ticks: {
          callback: (value: any) => value.toString(), // Display year as string
        },
      },
      y: {
        title: {
          display: true,
          text: 'Month',
        },
        ticks: {
          callback: (value: any) => {
            // Ensure the value is a valid index for the array
            const monthIndex = value - 1; // Months are 1-indexed in your data
            return monthIndex >= 0 &&
              monthIndex < this.scatterChartLabels.length
              ? this.scatterChartLabels[monthIndex]
              : '';
          }, // Display month names
        },
      },
    },
  };

  activityTimelineData: ChartData<'line'> = {
    labels: ['2020', '2021', '2022', '2023', '2024'], // Adjust as needed
    datasets: [
      {
        label: 'Activity Timeline',
        data: [10, 20, 30, 40, 50], // This matches the expected dataset format for a "line" chart
        borderColor: '#42A5F5',
        fill: false,
      },
    ],
  };

  assigneeTimelineData: ChartDataset<'line', { x: number; y: number }[]>[] = [
    {
      label: 'Assignee Timeline',
      data: [], // Dynamically populated with numbers
      borderColor: '#42A5F5',
      fill: false,
    },
  ];
  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      x: {
        type: 'time', // Make sure "time" is installed and configured in Chart.js
        time: {
          unit: 'year', // Specify the time unit (e.g., year, month, etc.)
        },
        title: {
          display: true,
          text: 'Date', // Label for the X-axis
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Value', // Label for the Y-axis
        },
      },
    },
  };

  patentIssuedDateMonth!: any;
  patentIssuedDateYear!: any;
  caseComplaintDatemonth!: any;
  caseComplaintDateYear!: any;

  scatterData: Point[] = [];

  public scatterChartData: ChartData<'scatter'> = {
    labels: this.scatterChartLabels,
    datasets: [
      {
        data: this.scatterData,
        // label: 'Series A',
        pointRadius: 10,
      },
    ],
  };

  public scatterChartType: 'scatter' = 'scatter';

  private api = inject(ApiService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);
  ngOnInit() {
    //YE MERA CODE HAI
    // this.processTimelineData(this.data.timeline_data)
    this.route.queryParams.subscribe(params => {
      let caseno = params['caseno'];
      let payload:any={};
      payload.case_no=caseno;
      this.fetchData(payload);
    });
    this.timelineEvents = this.data.assignments.map((assignment:any) => ({
      date: new Date(assignment.execution_date),
      label: `${assignment.assignor} → ${assignment.assignee}`
    }));
    //

    this.api.selectedCase$.subscribe((caseDetails) => {
      if (caseDetails) {
        this.caseData = caseDetails;
        console.log('Fetched case data:', this.caseData);
        this.getMonthAndYear();
        console.log(this.scatterData);
        this.updateAssigneeTimelineData(this.caseData);
      }
    });
  }


  processTimelineData(timelineData: any) {
    const labelsSet = new Set<string>();  // To store unique dates
    const datasets: any[] = [];
  
    timelineData.forEach((patent: any) => {
      const dataPoints: any[] = [];
  
      patent.assignments.forEach((assignment: any) => {
        labelsSet.add(assignment.execution_date);
        dataPoints.push({
          x: assignment.execution_date,
          y: assignment.assignee
        });
      });
  
      datasets.push({
        label: `Patent ${patent.patent_no}`,
        data: dataPoints,
        borderColor: this.getRandomColor(), // Function to get random colors
        fill: false,
        showLine: true,
        pointRadius: 5,
      });
    });
  
    this.assigneeTimelineData1 = {
      labels: Array.from(labelsSet).sort(),
      datasets
    };
  }
  
  // Function to generate random colors for better visualization
  getRandomColor() {
    return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
  }
  


  fetchData(payload: object): void {
    this.loader = true;
    this.api.getDetails(payload)
      .subscribe(
        (response: any) => {
          this.case = response;
          this.activity_timeline.push({
            date: this.case?.case.complaint_date ? new Date(this.case?.case.complaint_date): null,
            label: `${this.case?.case.case_no} → Case Filed Date`
          })
          if(this.case?.case_details.case_closed_date){

            this.activity_timeline.push({
              date: this.case?.case_details.case_closed_date ? new Date(this.case?.case_details.case_closed_date): null,
              label: `${this.case?.case.case_no} → Case Closed Date`
            })
          }
          if (this.case?.patents.length > 0) {
            this.case?.patents.forEach((ele: any) => {
              this.activity_timeline.push({
                date: ele.issue_date ? new Date(ele.issue_date): null,
                label: `${ele.patent_no} → issue date`
              })
              this.activity_timeline.push({
                date: ele.expiry_date ? new Date(ele.expiry_date): null,
                label: `${ele.patent_no} → expiry date`
              })
              if (ele.assignee_timeline && ele.assignee_timeline.assignments.length > 0) {
                ele.assignee_timeline.assignments = ele.assignee_timeline.assignments.map((assignment: any) => {
                  // Ensure execution_date is properly converted to a Date object
                  const executionDate = assignment.execution_date ? new Date(assignment.execution_date) : null;
  
                  return {
                    date: executionDate ? this.formatDate(executionDate) : '',  // Format only if valid
                    label: `${assignment.assignor} → ${assignment.assignee}`
                  };
                });
              } else {
                ele.assignee_timeline = { "assignments": [] };
              }
            });
            // console.log(this.case?.patents, "sssss");
          }
          this.loader = false;
          this.activity_timeline.sort(function(a: any, b: any) {
            if (!a.date && !b.date) return 0;          // Both dates are null
            if (!a.date) return 1;                     // a.date is null, put it after b
            if (!b.date) return -1;                    // b.date is null, put it after a
        
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        this.activity_timeline=this.activity_timeline.map((ele:any)=>{
          return{
            date:ele.date ? this.formatDate(ele.date) : '',
            label: ele.label
          }
        })
        // console.log(this.activity_timeline,"see this")
          
        },
        (error) => {
          this.loader = false;
          console.error('Error fetching data', error);
        }
      );
  }
  
  // Corrected formatDate function
  formatDate(date: Date | null): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';  // Ensure valid date
  
    const day = String(date.getDate()).padStart(2, '0'); // Ensures two-digit day
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensures two-digit month
    const year = String(date.getFullYear()); // Gets last two digits of year
  
    return `${day}/${month}/${year}`;
  }
  

  isValidDate(date: any): boolean {
    return !isNaN(new Date(date).getTime());
  }

  // Method to update assigneeTimelineData dynamically
  updateAssigneeTimelineData(caseData: ExcelData) {
    if (caseData.patentDetails?.assigneeTimeline) {
      const timelineEvents = caseData.patentDetails.assigneeTimeline.split(','); // Parse timeline data
      const formattedData = timelineEvents.map((event, index) => {
        const date = new Date(event.trim());
        return {
          x: date.getTime(), // Convert to timestamp
          y: index + 1, // Incremental value for y-axis
        };
      });

      // Update datasets
      this.assigneeTimelineData[0].data = formattedData;

      // Update labels for display (optional, if needed)
      this.chartLabels = timelineEvents.map((d) =>
        new Date(d.trim()).toLocaleDateString()
      );
    } else {
      console.warn('No assignee timeline available in the data.');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getMonthAndYear();
    this.cdRef.detectChanges();
    // this.chart.chart?.update();
  }

  reportImageUrl: string = '/report-preview.png'; // Add the correct path

  accessReport(docId: string): void {
    const userInfo = this.authService.getCurrentUser(); // Fetch the logged-in user info
    const price = this.caseData?.quickSearchReport[0]?.price;

    const dialogRef = this.dialog.open(ReportPaymentComponent, {
      width: '400px',
      data: {
        docId,
        user: userInfo,
        price: price,
      }, // Pass necessary data to the report purchase dialog
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'success') {
        console.log(`Payment successful for Document ID: ${docId}`);
        // Additional logic for successful report purchase
      } else {
        console.log(`Payment failed for Document ID: ${docId}`);
        this.errorMessage =
          'Payment Failed! Please write to us for more details.';
      }
    });
  }

  getMonthAndYear() {
    this.patentIssuedDateMonth = this.getMonth(this.caseData?.patentIssuedDate);
    this.patentIssuedDateYear = this.getYear(this.caseData?.patentIssuedDate);
    this.caseComplaintDatemonth = this.getMonth(
      this.caseData?.caseComplaintDate
    );
    this.caseComplaintDateYear = this.getYear(this.caseData?.caseComplaintDate);

    // console.log(this.patentIssuedDateMonth);
    // console.log(this.patentIssuedDateYear);
    // console.log(this.caseComplaintDatemonth);
    // console.log(this.caseComplaintDateYear);

    // Update scatter data
    this.scatterData = [
      { x: this.patentIssuedDateYear, y: this.patentIssuedDateMonth }, // Year, Month for patent issued date
      { x: this.caseComplaintDateYear, y: this.caseComplaintDatemonth }, // Year, Month for case complaint date
    ];
    this.scatterChartData.datasets[0].data = this.scatterData; // Assign the data to the chart
    // this.scatterChartData.labels=this.scatterChartLabels;
  }

  public chartClicked({
    event,
    active,
  }: {
    event: ChartEvent;
    active: object[];
  }): void {
    console.log(event, active);
  }

  public chartHovered({
    event,
    active,
  }: {
    event: ChartEvent;
    active: object[];
  }): void {
    console.log(event, active);
  }

  // isValidDate(date: any): any {
  //   const convertedDate = this.convertToDate(date);
  //   return convertedDate instanceof Date && !isNaN(convertedDate.getTime())
  //     ? convertedDate.toLocaleDateString('en-US') // Adjust format as needed
  //     : 'Invalid Date';
  // }

  goBack(): void {
    this.router.navigate(['/app-main-page']); // Navigate back to the list of cases
  }

  convertToDate(datese: any): Date {
    const startDate = new Date(1900, 0, 1);
    const correctedSerial = datese - 1;
    return new Date(
      startDate.getTime() + correctedSerial * 24 * 60 * 60 * 1000
    );
  }

  getYear(date: any): number {
    const convertedDate = this.convertToDate(date);
    return convertedDate instanceof Date && !isNaN(convertedDate.getTime())
      ? convertedDate.getFullYear()
      : 0;
  }

  getMonth(date: any): number {
    const convertedDate = this.convertToDate(date);
    return convertedDate instanceof Date && !isNaN(convertedDate.getTime())
      ? convertedDate.getMonth() + 1
      : 0; // Months are 1-indexed for display
  }
}
