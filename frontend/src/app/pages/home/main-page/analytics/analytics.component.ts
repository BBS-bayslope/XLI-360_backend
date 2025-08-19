import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  ElementRef
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import {
  ChartConfiguration,
  ChartData,
  ChartEvent,
  ChartOptions,
  ChartType,
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart, registerables } from 'chart.js';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { ExcelData } from '../../../admin/excelDataTpes-interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ApiService } from '../../../../services/api.service';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { Pie } from '@antv/g2plot';
import { Bar } from '@antv/g2plot';
import { PieChartComponent } from '../../../pie-chart/pie-chart.component';
import { StackedBarChartComponent } from '../../../charts/stackedBarChart.component';
import { DoughnutChartComponent } from '../../../charts/doughtnutChart.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { DonutChartComponent } from '../../../donut-chart/donut-chart.component';
// import * as CanvasJS from 'canvasjs';
// Ensure the plugin is registered
Chart.register(ChartDataLabels, ...registerables);

interface ChartData1 {
  region: string;
  qty: number;
}


@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    DonutChartComponent,
    BaseChartDirective,
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    CanvasJSAngularChartsModule,
    PieChartComponent,
    StackedBarChartComponent,
    DoughnutChartComponent,
    MatIcon,
    MatCheckboxModule,
    MatMenuModule,
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent
  implements OnInit, OnChanges, AfterViewInit, AfterViewChecked
{
  @Input() filterDataForAnalytics: any[] = [];
  @Input() excelData: any[] = [];
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective; // Access the chart instance
  // @ViewChild('BarContainer', { static: false }) barContainer?: ElementRef;

  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private el = inject(ElementRef);

  doughnutChartDataTotalCases: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [] }],
  };
  doughnutChartTypeTotalCases: 'doughnut' = 'doughnut';
  doughnutChartOptionsTotalCases: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '70%', // Adjust the cutout size for the doughnut chart
    plugins: {
      legend: {
        display: true, // Enable the legend
        position: 'right', // Position the legend to the left
        labels: {
          font: {
            size: 10, // Adjust font size of legend labels
          },
          padding: 10, // Add spacing between legend items
          usePointStyle: true, // Use point style (circle) for better UX
        },
      },
      tooltip: {
        enabled: true, // Enable tooltips
      },
    },
    layout: {
      padding: {
        top: 0, // Add padding to reduce chart size
        bottom: 50,
      },
    },
  };
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartDataSuedCompanies: ChartData<'bar'> = { labels: [], datasets: [] };
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y', //
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // ❌ no "undefined"
      tooltip: { enabled: true },
      datalabels: {
        display: false, // ✅ removes number inside bars
      },
    },

    scales: {
      x: { beginAtZero: true },
      y: { ticks: { font: { size: 12 }, color: '#000', padding: 5 } },
    },
  };
  public chartOptions: any = null;
  public charT: any = null; // Chart instance
  public Statusdata: any[] = []; // DataPoints Array
  public plaintiffTypeData: any[] = []; // DataPoints Array
  public defendantTypeData: any[] = []; // DataPoints Array
  public suedTechArea: any[] = []; // DataPoints Array
  public suedCompanies: any[] = []; // DataPoints Array
  public industryData: any[] = []; // DataPoints Array
  public casesByOc: any[] = []; // DataPoints Array
  public overlappingLawFirms: any[] = [];
  public overlappingParties: any[] = [];
  public transferredCases: any[] = [];
  loaderr: boolean = false;
  availableCharts = [
    { key: 'totalLitigation', label: 'Total Litigation Cases & Status' },
    { key: 'plaintiffType', label: 'Total Cases Filed by Plaintiff (by Type)' },
    { key: 'defendantType', label: 'Total Cases Filed by Defendant (by Type)' },
    { key: 'casesByOc', label: 'Total Cases by OC' },
    // { key: 'transferred', label: 'Total Cases transferred from OC to NPE' },
    { key: 'industry', label: 'Industry' },
    { key: 'techCategory', label: 'Tech Category' },
    { key: 'mostSuedTechAreas', label: 'Most Sued Tech Areas' },
    { key: 'mostSuedCompanies', label: 'Most Sued Companies' },
    { key: 'topPlaintiffs', label: 'Top Plaintiff' },
    { key: 'topDefendants', label: 'Top Defendants' },
    { key: 'topDefendantsFirm', label: 'Top Defendant Law Firm' },
    { key: 'topPlaintiffFirm', label: 'Top Plaintiff Law Firm' },
    { key: 'overlappingfirm', label: 'Overlapping Law Firms' },
    { key: 'overlappingparty', label: 'Overlapping Parties' },
  ];

  // Selected charts (default selection)
  selectedCharts: string[] = [];
  constructor() {
    Chart.register(this.drawTextPlugin); // Register the custom plugin
  }

  // ngOnInit(): void {
  //   // console.log(this.filterDataForAnalytics, this.excelData);
  //   const savedCharts = localStorage.getItem('selectedCharts');
  //   if (savedCharts) {
  //     this.selectedCharts = JSON.parse(savedCharts);
  //   } else {
  //     // Default selection
  //     this.selectedCharts = [
  //       'totalLitigation',
  //       'plaintiffType',
  //       'defendantType',
  //     ];
  //     this.saveSelectedCharts();
  //   }
  //   // console.dir(this.excelData);
  //   this.fetchCaseStats();
  //   this.fetchPlaintiffTypeStats();
  //   this.fetchIndustryStats();
  //   this.cdRef.detectChanges();
  //   // this.getAllPlaintiff();
  //   // this.getAllDefendent();
  //   // // this.totalCasesDataArrays= [];
  //   // this.calculateTotalCasesByStatus(); // Call the method to count Total case number .
  //   // this.storeUniquePlaintiffTypeAndSize(); // Call the method to count unique plaintiffTypeSize.
  //   // this.storeUniqueDefendantTypeAndSize(); // Call the method to count unique  defendantTypeSize.
  //   // this.countCaseByOc(); // Call the method to count unique  case of Oc.
  //   // this.storeUniqueTechCategories(); // Call the method to count unique  tech category.
  //   // this.storeUniqueIndustry(); // Call the method to count unique  industry.
  //   // this.storeUniqueMostSuedTechAreas();
  //   // this.storeUniqueTotalCaseOfPlaintiff();
  //   // this.storeUniqueTotalCaseOfDefendent();
  //   // Trigger change detection
  //   // this.onItemsToShowChangeInTopPlaitiff();
  //   // this.onItemsToShowChangeInAllDefendent();
  //   // this.getAllOriginalAndCurrentAssigne();
  //   // console.log(this.originalAssignee);
  //   // console.log(this.currentAssignee);
  //   // this.onItemsToShowChangeInTopPlaitiff();
  //   // this.getTopPlaintiffLawFirm();
  //   // this.getTopDefendantLawFirm();
  //   // this.getOverlappingLawFirm();
  //   // this.getCasesTransferredFromOCToNPE();
  //   // this.updateMostSuedCompaniesChart();
  //   // let chart = new CanvasJS.Chart("BarContainer", {
  //   //   title: { text: "Bar Chart Example" },
  //   //   data: [{ type: "column", dataPoints: [{ label: "A", y: 10 }, { label: "B", y: 20 }] }]
  //   // });
  //   // chart.render();
  //   // this.cdRef.detectChanges();
  //   this.cdRef.detectChanges();
  // }

  ngOnInit(): void {
    const savedCharts = localStorage.getItem('selectedCharts');
    if (savedCharts) {
      this.selectedCharts = JSON.parse(savedCharts);
    }
    // Forcefully set all charts as selected, overriding any saved value
    this.selectedCharts = this.availableCharts.map((chart) => chart.key);
    this.saveSelectedCharts(); // Save all charts to localStorage
    this.fetchCaseStats();
    this.fetchPlaintiffTypeStats();
    this.fetchIndustryStats();
    this.cdRef.detectChanges();
    console.log('Selected Charts:', this.selectedCharts); // Debug log
  }

  excelDataAnalytics: any[] = [];
  piePlot!: Pie; // Store chart instance

  ngOnChanges() {
    // console.log(this.Statusdata,"dsfds")
    // if (this.Statusdata.length > 0) {
    //   this.renderChart();
    //   this.cdRef.detectChanges();
    // }
  }
  stackedBarPlot!: Bar;
  renderStackedBarChart() {
    if (!this.stackedBarPlot) {
      console.log(this.overlappingLawFirms);

      // Transform API data into a format suitable for the stacked bar chart
      const transformedData = this.overlappingLawFirms.flatMap((firm) => [
        {
          law_firm: firm.law_firm,
          type: 'Plaintiff Cases',
          value: firm.plaintiff_case_count,
        },
        {
          law_firm: firm.law_firm,
          type: 'Defendant Cases',
          value: firm.defendant_case_count,
        },
      ]);

      this.stackedBarPlot = new Bar(
        this.el.nativeElement.querySelector('#stacked-bar-chart-container'),
        {
          data: transformedData,
          isStack: true, // Enable stacking
          xField: 'value', // X-axis is the number of cases
          yField: 'law_firm', // Y-axis is the law firm names
          seriesField: 'type', // Stack by Plaintiff & Defendant cases
          legend: { layout: 'horizontal', position: 'bottom' },
          label: {
            position: 'middle',
            layout: [
              { type: 'interval-adjust-position' }, // Adjusts label position
              { type: 'interval-hide-overlap' }, // Hides overlapping labels
              { type: 'adjust-color' }, // Adjusts label color
            ],
          },
          interactions: [{ type: 'element-active' }],
        }
      );
    } else {
      // Update chart data dynamically
      const updatedData = this.overlappingLawFirms.flatMap((firm) => [
        {
          law_firm: firm.law_firm,
          type: 'Plaintiff Cases',
          value: firm.plaintiff_case_count,
        },
        {
          law_firm: firm.law_firm,
          type: 'Defendant Cases',
          value: firm.defendant_case_count,
        },
      ]);

      this.stackedBarPlot.changeData(updatedData);
    }

    this.stackedBarPlot.render();
  }

  showChart = false;

  ngAfterViewInit() {
    // const data: ChartData1[] = this.Statusdata;
    // console.log(data,"see",this.Statusdata)
    // const piePlot = new Pie(this.el.nativeElement.querySelector('#pie-chart-container'), {
    //   appendPadding: 10,
    //   data,
    //   angleField: 'qty',
    //   colorField: 'region',
    //   radius: 0.7,
    //   label: {
    //     type: 'spider',
    //     labelHeight: 20,
    //     content: (data) => `${(data as ChartData1).region}: ${(data as ChartData1).qty}`,
    //   },
    //   interactions: [{ type: 'element-active' }],
    //   legend: {
    //     layout: 'horizontal',
    //     position: 'bottom',
    //   },
    // });
    // piePlot.render();
  }

  ngAfterViewChecked(): void {
    // let chart = new CanvasJS.Chart("BarContainer", {
    //   title: { text: "Bar Chart Example" },
    //   data: [{ type: "column", dataPoints: [{ label: "A", y: 10 }, { label: "B", y: 20 }] }]
    // });
    // chart.render();
    // this.cdRef.detectChanges();
  }

  //MY CODE

  toggleChartSelection(chartKey: string) {
    const index = this.selectedCharts.indexOf(chartKey);
    if (index >= 0) {
      this.selectedCharts.splice(index, 1);
    } else {
      this.selectedCharts.push(chartKey);
    }
    this.saveSelectedCharts(); // Keep your existing save logic
  }

  saveSelectedCharts() {
    localStorage.setItem('selectedCharts', JSON.stringify(this.selectedCharts));
    // this.renderStackedBarChart()
  }
  generateUniqueColors(count: number): string[] {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 137.5) % 360; // Ensures distinct hues
      colors.push(`hsl(${hue}, 70%, 50%)`); // HSL format for variety
    }
    return colors;
  }

  fetchCaseStats(): void {
    this.loaderr = true;
    this.api.getCaseStats().subscribe(
      (response: any) => {
        if (response && response?.data) {
          const caseStatusCounts = response.data?.case_status_counts;
          this.overlappingLawFirms = response.data?.overlapping_law_firms.slice(
            0,
            25
          );
          this.overlappingParties = response.data?.overlapping_parties.slice(
            0,
            10
          );
          // this.renderStackedBarChart()
          // Extract labels and data
          this.Statusdata = Object.entries(caseStatusCounts).map(
            ([region, qty]) => ({
              region,
              qty,
            })
          );

          let total_tech_areas = response.data?.tech_area.slice(0, 10);
          const categories = total_tech_areas.map(
            (item: any) => item.tech_category
          );
          const caseCounts = total_tech_areas.map(
            (item: any) => item.case_count
          );
          this.barChartDataTechCategory.labels = response.data?.tech_area
            .slice(0, 25)
            .map((item: any) => item.tech_category);
          this.barChartDataTechCategory.datasets[0].data =
            response.data?.tech_area
              .slice(0, 25)
              .map((item: any) => item.case_count);
          this.barChartData = {
            labels: categories,
            datasets: [
              {
                // label: 'Number of Cases',
                data: caseCounts,
                backgroundColor: [
                  'rgba(13, 113, 199, 0.8)', // Adjust colors as needed
                ],
                borderColor: '#000',
                borderWidth: 2,
              },
            ],
          };
          this.barChartDataSuedCompanies = {
            labels: response.data?.top_defendants
              .slice(0, 10)
              .map((item: any) =>
                item.defendant.length > 30
                  ? item.defendant.split(',')[0] + '...'
                  : item.defendant
              ),
            datasets: [
              {
                data: response.data?.top_defendants
                  .slice(0, 10)
                  .map((item: any) => item.case_count),
                backgroundColor: ['rgba(13, 105, 19, 0.8)'],
                borderColor: '#000',
                borderWidth: 2,
              },
            ],
          };

          const defendants_n = response.data?.top_defendants.map(
            (item: any) => item.defendant
          );
          const defendants_cnt = response.data?.top_defendants.map(
            (item: any) => item.case_count
          );
          const plaintiff_n = response.data?.top_plaintiffs.map(
            (item: any) => item.plaintiff
          );
          const plaintiff_cnt = response.data?.top_plaintiffs.map(
            (item: any) => item.case_count
          );

          const defendants_fn = response.data?.top_defendant_law_firms.map(
            (item: any) => item.defendant_law_firm
          );
          const defendants_fcnt = response.data?.top_defendant_law_firms.map(
            (item: any) => item.case_count
          );
          const plaintiff_fn = response.data?.top_plaintiff_law_firms.map(
            (item: any) => item.plaintiff_law_firm
          );
          const plaintiff_fcnt = response.data?.top_plaintiff_law_firms.map(
            (item: any) => item.case_count
          );

          this.barChartDataTopDefandants.labels = defendants_n;
          this.barChartDataTopPlaintiffs.labels = plaintiff_n;
          this.barChartDataTopDefandants.datasets[0].data = defendants_cnt;
          this.barChartDataTopPlaintiffs.datasets[0].data = plaintiff_cnt;

          this.barChartDataTopDefandantFirm.labels = defendants_fn;
          this.barChartDataTopPlaintiffFirm.labels = plaintiff_fn;
          this.barChartDataTopDefandantFirm.datasets[0].data = defendants_fcnt;
          this.barChartDataTopPlaintiffFirm.datasets[0].data = plaintiff_fcnt;
        }

        this.loaderr = false;
        this.cdRef.detectChanges();
      },
      (error) => {
        this.loaderr = false;
        console.error('Error fetching data', error);
      }
    );
  }

  fetchPlaintiffTypeStats(): void {
    this.api.getPlaintiffTypeStats().subscribe(
      (response: any) => {
        if (response && response.data) {
          // this.transferredCases=[{type:"OC-->NPE",value:response.data?.transferredCases}];
          this.plaintiffTypeAndSizeChartData.labels = Object.keys(
            response.data?.plaintiff_type_counts
          );
          this.plaintiffTypeAndSizeChartData.datasets[0].data = Object.values(
            response.data?.plaintiff_type_counts
          );
          this.plaintiffTypeData = Object.entries(
            response.data?.plaintiff_type_counts
          ).map(([region, qty]) => ({
            region,
            qty,
          }));
          this.defendantTypeData = Object.entries(
            response.data?.defendant_type_counts
          ).map(([region, qty]) => ({
            region,
            qty,
          }));
          this.defendantTypeAndSizeChartData.labels = Object.keys(
            response.data?.defendant_type_counts
          );
          this.defendantTypeAndSizeChartData.datasets[0].data = Object.values(
            response.data?.defendant_type_counts
          );
          this.defendantTypeAndSizeChartData.datasets[0].backgroundColor =
            this.generateUniqueColors(
              Object.keys(response.data?.defendant_type_counts).length
            );
          let defendant = response?.data?.defendant_type_counts['loc'];
          let plaintiff =
            response.data?.plaintiff_type_counts['operating company'];
          // console.log(defendant,plaintiff)
          this.casesByOc = [
            { region: 'defendant', qty: defendant },
            { region: 'plaintiff', qty: plaintiff },
          ];
          // this.caseByOcChartData.labels = ['defendant','plaintiff'];
          // this.caseByOcChartData.datasets[0].data = [defendant,plaintiff];
        }
      },
      (error) => {
        this.loaderr = false;
        console.error('Error fetching data', error);
      }
    );
  }

  fetchIndustryStats(): void {
    this.api.getIndustryStats().subscribe(
      (response: any) => {
        if (response && response.data) {
          this.industryChartData.labels = Object.keys(response?.data);
          this.industryChartData.datasets[0].data = Object.values(
            response?.data
          );
          this.industryData = Object.entries(response?.data).map(
            ([region, qty]) => ({
              region,
              qty,
            })
          );
        }
      },
      (error) => {
        this.loaderr = false;
        console.error('Error fetching data', error);
      }
    );
  }

  totalCasesDataArrays: any[] = [];
  calculateTotalCasesByStatus() {
    const statusCounts: { [key: string]: number } = {};

    // Group cases by their statuses
    this.filterDataForAnalytics.forEach((obj) => {
      const status = obj?.caseDetails?.status || 'Unknown'; // Default to 'Unknown' if status is missing
      if (!statusCounts[status]) {
        statusCounts[status] = 0; // Initialize if not present
      }
      statusCounts[status]++;
    });

    // Prepare data for the chart
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    this.doughnutChartDataTotalCases.labels = labels;
    this.doughnutChartDataTotalCases.datasets[0].data = data;

    console.log('Chart Data by Status:', statusCounts);
  }
  // for total case  Doughnut chart
  caseNumber: number = 0;
  public doughnutChartLabelsTotalCases: string[] = ['Total Cases'];

  // public doughnutChartDataTotalCases: ChartData<'doughnut'> = {
  //   labels: this.doughnutChartLabelsTotalCases,
  //   datasets: [
  //     {
  //       label: 'Counts',
  //       data: [this.caseNumber], // Example data
  //     },
  //   ],
  // };

  // public doughnutChartTypeTotalCases: 'doughnut' = 'doughnut';

  // public doughnutChartOptionsTotalCases: ChartOptions<'doughnut'> = {
  //   responsive: true,
  //   maintainAspectRatio: false,
  //   cutout: '70%', // Adjust the cutout size for the doughnut chart
  //   plugins: {
  //     legend: {
  //       display: true, // Enable the legend
  //       position: 'top', // Position the legend to the left
  //       labels: {
  //         font: {
  //           size: 10, // Adjust font size of legend labels
  //         },
  //         padding: 10, // Add spacing between legend items
  //         usePointStyle: true, // Use point style (circle) for better UX
  //       },
  //     },
  //     tooltip: {
  //       enabled: true, // Enable tooltips
  //     },
  //   },
  //   layout: {
  //     padding: {
  //       top: 0, // Add padding to reduce chart size
  //       bottom: 50,
  //     },
  //   },
  // };

  private drawTextPlugin = {
    id: 'drawTextPlugin',
    afterDraw: (chart: Chart) => {
      // Use optional chaining and check if labels exist
      const labels = chart.data.labels;
      // Check if this is the first chart by using a specific property
      if (labels && labels[0] === 'Total Cases') {
        let ctx = chart.ctx;
        let caseNumberText = `${this.caseNumber}`;
        let totalText = 'Total';

        // Positioning for the text
        let textX =
          chart.chartArea.left +
          (chart.chartArea.right - chart.chartArea.left) / 2;
        let textY =
          chart.chartArea.top +
          (chart.chartArea.bottom - chart.chartArea.top) / 2;

        // Draw case number
        ctx.save();
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = 'blue';
        ctx.textBaseline = 'middle';
        ctx.fillText(caseNumberText, textX - 25, textY - 10);
        ctx.restore();

        // Draw "Total"
        ctx.save();
        ctx.font = 'italic 15px sans-serif';
        ctx.fillStyle = 'black';
        ctx.fillText(totalText, textX - 13, textY + 15);
        ctx.restore();
      }
    },
  };

  public chartClicked($event: { event?: ChartEvent; active?: object[] }): void {
    if ($event.event) {
      console.log('Chart click event:', $event.event);
    }
    if ($event.active && $event.active.length > 0) {
      console.log('Active elements:', $event.active);
    } else {
      console.log('No active elements');
    }
  }

  public chartHovered({
    event,
    active,
  }: {
    event: ChartEvent;
    active: object[];
  }): void {
    // console.log(event, active);
  }

  //graph for plaintiffTypeAndSize
  uniquePlaintiffTypeAndSize: any[] = []; // Array to hold unique plaintiffTypeAndSize
  countsPlaintiffTypeAndSize: { [key: string]: number } = {}; //store count of values

  //pia chart for plaintiffTypeAndSize
  public plaintiffTypeAndSizeChartType: ChartType = 'pie';
  public plaintiffTypeAndSizeChartData: ChartData<
    'pie',
    number[],
    string | string[]
  > = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Total Litigation Cases Filed by Plaintiff',
      },
    ],
  };
  public plaintiffTypeAndSizeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 10, // Reduce font size of legend labels if needed
          },
        },
      },
      tooltip: {
        enabled: true, // Enable tooltips for better data interaction
      },
      datalabels: {
        display: true, // Disable labels on the chart
      },
      // datalabels: {
      //   formatter: (value: number, ctx: any) => {
      //     if (ctx.chart.data.labels) {
      //       return ctx.chart.data.labels[ctx.dataIndex]; // Return the label for each segment
      //     }
      //     return '';
      //   },
      // },
    },
    layout: {
      padding: {
        top: 0, // Add padding to reduce chart size
        bottom: 50,
      },
    },
  };

  storeUniquePlaintiffTypeAndSize(): void {
    const plaintiffTypeSizeData = this.filterDataForAnalytics
      .map((item) => item?.administrativeDetails?.plaintiffTypeAndSize) // Use optional chaining
      .filter(
        (plaintiffTypeAndSize) =>
          typeof plaintiffTypeAndSize === 'string' &&
          plaintiffTypeAndSize.trim() !== ''
      ) // Exclude invalid values
      .map((plaintiffTypeAndSize) => this.normalizeType(plaintiffTypeAndSize)); // Normalize the type

    // Create a unique set
    const uniqueSet = new Set(plaintiffTypeSizeData);

    // Assign unique values back to uniquePlaintiffTypeAndSize
    this.uniquePlaintiffTypeAndSize = Array.from(uniqueSet);

    // Call the count function
    this.countPlaintiffTypeAndSize();
  }

  countPlaintiffTypeAndSize(): void {
    this.countsPlaintiffTypeAndSize = this.uniquePlaintiffTypeAndSize.reduce(
      (acc, plaintiffTypeSize) => {
        const normalizedType = this.normalizeType(plaintiffTypeSize);
        acc[normalizedType] = 0; // Set initial count to 0
        return acc;
      },
      {}
    );

    this.filterDataForAnalytics.forEach((item) => {
      const type = item?.administrativeDetails?.plaintiffTypeAndSize;
      const normalizedType = this.normalizeType(type);
      if (this.countsPlaintiffTypeAndSize.hasOwnProperty(normalizedType)) {
        this.countsPlaintiffTypeAndSize[normalizedType] += 1;
      }
    });

    const countValuesPlaintiffTypeSize = this.uniquePlaintiffTypeAndSize.map(
      (plaintiffTypeAndSize) =>
        this.countsPlaintiffTypeAndSize[
          this.normalizeType(plaintiffTypeAndSize)
        ] || 0
    );

    this.plaintiffTypeAndSizeChartData.labels = this.uniquePlaintiffTypeAndSize;
    this.plaintiffTypeAndSizeChartData.datasets[0].data =
      countValuesPlaintiffTypeSize;

    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is not initialized yet.');
      }
    }, 200);
  }

  //graph for defendantTypeAndSize
  uniqueDefendantTypeAndSize: any[] = []; // Array to hold unique defendantTypeAndSize
  countsDefendantTypeAndSize: { [key: string]: number } = {}; //store count of values

  //pia chart for defendantTypeAndSize
  public defendantTypeAndSizeChartType: ChartType = 'pie';
  public defendantTypeAndSizeChartData: ChartData<
    'pie',
    number[],
    string | string[]
  > = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Total Litigation Cases Filed by Defendant',
      },
    ],
  };
  public defendantTypeAndSizeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 0, // Add padding to reduce chart size
        bottom: 50,
        left: 30,
        right: 30,
      },
    },
    plugins: {
      legend: {
        display: true, // Enable legend
        position: 'top', // Align legend to the left
        labels: {
          font: {
            size: 10, // Reduce font size for legend labels
          },
        },
      },
      tooltip: {
        enabled: true, // Enable tooltips for data interaction
      },
      datalabels: {
        display: true, // Disable labels on the chart
      },
    },
  };

  storeUniqueDefendantTypeAndSize(): void {
    const defendantTypeAndSizeData = this.filterDataForAnalytics
      .map((item) => item?.administrativeDetails?.defendantTypeAndSize)
      .filter((defendantTypeAndSize) => defendantTypeAndSize != null)
      .map((defendantTypeAndSize) => this.normalizeType(defendantTypeAndSize))
      .filter((defendantTypeAndSize) => defendantTypeAndSize !== '');

    const uniqueSet = new Set(defendantTypeAndSizeData);
    this.uniqueDefendantTypeAndSize = Array.from(uniqueSet);
    this.countDefendantTypeAndSize();
  }

  countDefendantTypeAndSize(): void {
    this.countsDefendantTypeAndSize = this.uniqueDefendantTypeAndSize.reduce(
      (acc, defendantTypeAndSize) => {
        acc[defendantTypeAndSize] = 0; // Set initial count to 0
        return acc;
      },
      {}
    );

    this.filterDataForAnalytics.forEach((item) => {
      const type = item?.administrativeDetails?.defendantTypeAndSize;
      const normalizedType = this.normalizeType(type);
      if (this.countsDefendantTypeAndSize.hasOwnProperty(normalizedType)) {
        this.countsDefendantTypeAndSize[normalizedType] += 1;
      }
    });

    const countValuesDefendantTypeAndSize = this.uniqueDefendantTypeAndSize.map(
      (defendantTypeAndSize) =>
        this.countsDefendantTypeAndSize[defendantTypeAndSize] || 0
    );

    this.defendantTypeAndSizeChartData.labels = this.uniqueDefendantTypeAndSize;
    this.defendantTypeAndSizeChartData.datasets[0].data =
      countValuesDefendantTypeAndSize;

    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is not initialized yet.');
      }
    }, 200);
  }

  //pia chart for caseByOc
  public caseByOcChartType: ChartType = 'pie';
  public caseByOcChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Cases Filed by Oc',
      },
    ],
  };
  public caseByOcChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, // Enable legend
        position: 'top', // Align legend to the left
        labels: {
          font: {
            size: 10, // Adjust font size for legend labels
          },
        },
      },
      tooltip: {
        enabled: true, // Enable tooltips for user interaction
      },
      datalabels: {
        display: true, // Disable data labels on the chart
      },
    },
    layout: {
      padding: {
        top: 0, // Add padding to reduce chart size
        bottom: 50,
      },
    },
  };

  countCaseByOc() {
    let totalOcDataArrays: number[] = [];
    let totalOcLabelArrays: string[] = [];

    const valueDefendentTypeSize = this.countsDefendantTypeAndSize['oc'] || 0;
    const valuePlaintiffTypeAndSize =
      this.countsPlaintiffTypeAndSize['oc'] || 0;

    totalOcDataArrays = [valueDefendentTypeSize, valuePlaintiffTypeAndSize];
    totalOcLabelArrays = ['Plaintiff Oc', 'Defendant Oc'];

    console.log(
      'Counts for Defendant Type and Size:',
      this.countsDefendantTypeAndSize
    );
    console.log(
      'Counts for Plaintiff Type and Size:',
      this.countsPlaintiffTypeAndSize
    );

    this.caseByOcChartData.datasets[0].data = totalOcDataArrays;
    this.caseByOcChartData.labels = totalOcLabelArrays;

    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is not initialized yet.');
      }
    }, 200);
  }

  normalizeType(type: string | undefined | null): string {
    if (!type) return '';
    switch (type.toLowerCase()) {
      case 'operating company':
      case 'oc':
        return 'oc';
      case 'npe (patent assertion entity)':
        return 'npe';
      case 'loc':
        return 'loc';
      default:
        return type.trim().toLowerCase();
    }
  }

  //graph  for tech categories
  uniqueTechCategories: any[] = []; // Array to hold unique tech categories
  countsTechCategory: { [key: string]: number } = {}; //store count of values
  //  bar chart for techCategory
  public barChartTypeTechCategory: 'bar' = 'bar';
  public barChartDataTechCategory: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [], // Update with your actual data
        backgroundColor: [
          'rgba(9, 120, 6, 0.8)', // Adjust colors as needed
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };
  public barChartOptionsTechCategory: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: '#000',
          font: {
            weight: 'bold',
            size: 12,
          },
          maxRotation: 45,
          minRotation: 30,
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#000',
          font: {
            weight: 'bold',
            size: 14,
          },
          callback: (value) => value.toLocaleString(),
        },
        grid: {
          color: '#eee',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
      datalabels: {
        display: false, // ✅ This disables datalabels if plugin is still included
      },
    },
  };

  public barChartTypeTopDefandants: 'bar' = 'bar';
  public barChartDataTopDefandants: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [], // Update with your actual data
        backgroundColor: [
          'rgba(255, 99, 71, 0.8)', // Adjust colors as needed
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };
  public barChartOptionsTopDefandants: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true, // Ensures the y-axis starts at 0
        ticks: {
          color: '#000', // Black color for x-axis labels
          font: {
            weight: 'bold', // Bold font for x-axis labels
            size: 14, // Font size
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#000', // Black color for x-axis labels
          font: {
            weight: 'bold', // Bold font for x-axis labels
            size: 14, // Font size
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
      datalabels: {
        display: false,
      },
    },
  };
  public barChartTypeTopPlaintiffs: 'bar' = 'bar';
  public barChartDataTopPlaintiffs: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [], // Update with your actual data
        backgroundColor: [
          'rgba(200, 234, 9, 0.8)', // Adjust colors as needed
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };
  public barChartOptionsTopPlaintiffs: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true, // Ensures the y-axis starts at 0
        ticks: {
          color: '#000', // Dark color for X-axis labels
          font: {
            weight: 'bold', // Bold font
            size: 14, // Optional: control font size
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#000', // Dark color for X-axis labels
          font: {
            weight: 'bold', // Bold font
            size: 14, // Optional: control font size
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
      datalabels: {
        display: false,
      },
    },
  };
  public barChartTypeTopDefandantFirm: 'bar' = 'bar';
  public barChartDataTopDefandantFirm: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [], // Update with your actual data
        backgroundColor: [
          'rgba(255, 99, 71, 0.8)', // Adjust colors as needed
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };
  public barChartOptionsTopDefandantFirm: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true, // Ensures the y-axis starts at 0
        ticks: {
          color: '#000', // Black color for x-axis labels
          font: {
            weight: 'bold', // Bold font for x-axis labels
            size: 14, // Font size
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#000', // Black color for x-axis labels
          font: {
            weight: 'bold', // Bold font for x-axis labels
            size: 14, // Font size
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
      datalabels: {
        display: false,
      },
    },
  };
  public barChartTypeTopPlaintiffFirm: 'bar' = 'bar';
  public barChartDataTopPlaintiffFirm: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [], // Update with your actual data
        backgroundColor: [
          'rgba(255, 99, 71, 0.8)', // Adjust colors as needed
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };
  public barChartOptionsTopPlaintiffFirm: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true, // Ensures the y-axis starts at 0
        ticks: {
          color: '#000', // Black color for x-axis labels
          font: {
            weight: 'bold', // Bold font for x-axis labels
            size: 14, // Font size
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#000', // Black color for x-axis labels
          font: {
            weight: 'bold', // Bold font for x-axis labels
            size: 14, // Font size
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
      datalabels: {
        display: false,
      },
    },
  };
  storeUniqueTechCategories(): void {
    const techCategoryData = this.filterDataForAnalytics
      .map((item) => item?.patentDetails?.techCategory)
      .filter(
        (category) => typeof category === 'string' && category.trim() !== ''
      ); // Filter out valid strings

    // Split data by '|' and ',' and normalize by trimming whitespace and converting to lowercase
    const splitCategories = techCategoryData
      .flatMap((category) => category.split(/[\|,]/)) // Split by '|' or ','
      .map((subCategory) => subCategory.trim().toLowerCase()) // Trim and normalize to lowercase
      .filter((subCategory) => subCategory !== ''); // Remove empty strings

    // Count occurrences of each category
    const categoryCounts: { [key: string]: number } = splitCategories.reduce(
      (acc, category) => {
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {}
    );

    // Sort categories by count in descending order
    const sortedCategories = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1]
    );

    // Take the top 10 categories
    const top10 = sortedCategories.slice(0, 30);
    const others = sortedCategories.slice(30);

    // Create data for "Others"
    const othersCount = others.reduce((sum, [, count]) => sum + count, 0);

    // Create updated chart data
    const finalCategories = top10.map(([category]) => category);
    const finalCounts = top10.map(([, count]) => count);

    // if (othersCount > 0) {
    //   finalCategories.push('Others');
    //   finalCounts.push(othersCount);
    // }

    // Update the chart data
    this.barChartDataTechCategory.datasets[0].data = finalCounts;
    this.barChartDataTechCategory.labels = finalCategories;

    console.log(finalCounts, finalCategories);

    // Update the chart
    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is not initialized yet.');
      }
    }, 200);
  }

  countTechCategoryOccurrences(): void {
    // Initialize counts object for unique tech categories
    this.countsTechCategory = this.uniqueTechCategories.reduce(
      (acc, category) => {
        acc[category.toLowerCase()] = 0; // Initialize count to 0
        return acc;
      },
      {}
    );

    // Count occurrences of each unique tech category
    this.filterDataForAnalytics.forEach((item) => {
      const rawCategory = item?.patentDetails?.techCategory || '';
      const subCategories = rawCategory
        .split(/[\|,]/)
        .map((subCategory: any) => subCategory.trim().toLowerCase())
        .filter((subCategory: any) => subCategory !== ''); // Clean and split data

      // Increment count for each subcategory
      subCategories.forEach((subCategory: any) => {
        if (this.countsTechCategory.hasOwnProperty(subCategory)) {
          this.countsTechCategory[subCategory] += 1;
        }
      });
    });

    // Map counts to chart values
    const countValuesTechCategory = this.uniqueTechCategories.map(
      (category) => this.countsTechCategory[category] || 0
    );

    // Assign data to chart
    this.barChartDataTechCategory.datasets[0].data = countValuesTechCategory;
    this.barChartDataTechCategory.labels = this.uniqueTechCategories;

    // Refresh the chart
    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is not initialized yet.');
      }
    }, 200);
  }

  //graph  for TotalCaseOfPlaintiff
  uniqueTotalCaseOfPlaintiff: any[] = []; // Array to hold unique TotalCaseOfPlaintiff
  countsTotalCaseOfPlaintiff: { [key: string]: number } = {}; //store count of values
  //  bar chart for  TotalCaseOfPlaintiff
  public barChartTypeTotalCaseOfPlaintiff: 'bar' = 'bar';
  public barChartDataTotalCaseOfPlaintiff: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [], // Update with your actual data
        backgroundColor: [
          'rgba(255, 99, 71, 0.8)', // Adjust colors as needed
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };
  public barChartOptionsTotalCaseOfPlaintiff: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true, // Ensures the y-axis starts at 0
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: false,
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
    },
  };
  storeUniqueTotalCaseOfPlaintiff(): void {
    const plaintiffOrPetitionerData = this.filterDataForAnalytics
      .map((item) => item.legalEntities?.plaintiffOrPetitioner)
      .filter(
        (plaintiffOrPetitioner) => typeof plaintiffOrPetitioner === 'string'
      ); // Ensure it's a string

    const uniqueSet = new Set(
      plaintiffOrPetitionerData.map((plaintiffOrPetitioner) =>
        plaintiffOrPetitioner.trim().toLowerCase()
      )
    );

    // Assign unique values back to uniqueTotalCaseOfPlaintiff
    this.uniqueTotalCaseOfPlaintiff = Array.from(uniqueSet);
    this.countTotalCaseOfPlaintiffOccurrences();
    this.cdRef.detectChanges();
  }
  countTotalCaseOfPlaintiffOccurrences(): void {
    if (!this.chart?.chart) {
      console.warn('Chart is not initialized yet for Total Case of Plaintiff.');
      return; // Exit the function if the chart is not ready
    }

    // Initialize counts with unique plaintiffs
    this.countsTotalCaseOfPlaintiff = this.uniqueTotalCaseOfPlaintiff.reduce(
      (acc, plaintiffOrPetitioner) => {
        acc[plaintiffOrPetitioner.toLowerCase()] = 0; // Initialize count to 0
        return acc;
      },
      {}
    );

    // Count occurrences
    this.filterDataForAnalytics.forEach((item) => {
      const type = item.legalEntities?.plaintiffOrPetitioner;
      if (typeof type === 'string') {
        const lowerCaseType = type.toLowerCase();
        if (this.countsTotalCaseOfPlaintiff.hasOwnProperty(lowerCaseType)) {
          this.countsTotalCaseOfPlaintiff[lowerCaseType] += 1;
        }
      }
    });

    // Convert counts to an array of values
    const countValuesPlaintiffOrPetitioner =
      this.uniqueTotalCaseOfPlaintiff.map(
        (plaintiffOrPetitioner) =>
          this.countsTotalCaseOfPlaintiff[
            plaintiffOrPetitioner.toLowerCase()
          ] || 0
      );

    // Assign the data to the chart data
    this.barChartDataTotalCaseOfPlaintiff.datasets[0].data =
      countValuesPlaintiffOrPetitioner;

    // Assign the labels to the chart labels
    this.barChartDataTotalCaseOfPlaintiff.labels =
      this.uniqueTotalCaseOfPlaintiff;

    // Update and refresh the chart
    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update(); // Refresh the chart
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is still not initialized after timeout.');
      }
    }, 100); // Add a small delay to ensure the chart is ready
  }

  //graph  for TotalCaseOfDefendent
  uniqueTotalCaseOfDefendent: any[] = []; // Array to hold unique TotalCaseOfPlaintiff
  countsTotalCaseOfDefendent: { [key: string]: number } = {}; //store count of values
  //  bar chart for  TotalCaseOfPlaintiff
  public barChartTypeTotalCaseOfDefendent: 'bar' = 'bar';
  public barChartDataTotalCaseOfDefendent: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [], // Update with your actual data
        backgroundColor: [
          'rgba(255, 99, 71, 0.8)', // Adjust colors as needed
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };
  public barChartOptionsTotalCaseOfDefendent: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true, // Ensures the y-axis starts at 0
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: false,
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
    },
  };
  storeUniqueTotalCaseOfDefendent(): void {
    const defendantData = this.filterDataForAnalytics
      .map((item) => item.legalEntities?.defendant)
      .filter(
        (defendant) => typeof defendant === 'string' && defendant.trim() !== ''
      );

    const uniqueSet = new Set(
      defendantData.map((defendant) => defendant.trim().toLowerCase())
    );

    // Assign unique values back to uniqueTotalCaseOfDefendant
    this.uniqueTotalCaseOfDefendent = Array.from(uniqueSet);

    // Count occurrences
    this.countTotalCaseOfDefendentOccurrences();
    this.cdRef.detectChanges();
  }

  countTotalCaseOfDefendentOccurrences(): void {
    if (!this.chart || !this.chart.chart) {
      console.warn('Chart is not initialized yet for Total Case of Defendant.');
      return; // Exit the function if the chart is not ready
    }

    // Initialize counts object with unique defendants
    this.countsTotalCaseOfDefendent = this.uniqueTotalCaseOfDefendent.reduce(
      (acc, defendant) => {
        if (typeof defendant === 'string') {
          acc[defendant.toLowerCase()] = 0; // Set initial count to 0
        }
        return acc;
      },
      {}
    );

    // Count occurrences
    this.filterDataForAnalytics.forEach((item) => {
      const type =
        typeof item.legalEntities?.defendant === 'string'
          ? item.legalEntities?.defendant.toLowerCase()
          : null;

      if (type && this.countsTotalCaseOfDefendent.hasOwnProperty(type)) {
        this.countsTotalCaseOfDefendent[type] += 1;
      }
    });

    // Convert counts to an array of values
    const countValuesDefendent = this.uniqueTotalCaseOfDefendent.map(
      (defendant) =>
        typeof defendant === 'string'
          ? this.countsTotalCaseOfDefendent[defendant.toLowerCase()] || 0
          : 0
    );

    // Assign the data to the chart data
    this.barChartDataTotalCaseOfDefendent.datasets[0].data =
      countValuesDefendent;

    // Assign the labels to the chart labels
    this.barChartDataTotalCaseOfDefendent.labels =
      this.uniqueTotalCaseOfDefendent;

    // Refresh the chart to reflect changes
    setTimeout(() => {
      if (this.chart && this.chart.chart) {
        this.chart.chart.update(); // Refresh the chart
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is still not initialized after timeout.');
      }
    }, 100); // Add a small delay to ensure the chart is ready
  }

  // MostSuedTechAreas
  uniqueMostSuedTechAreas: any[] = []; // Array to hold unique tech categories
  countsMostSuedTechAreas: { [key: string]: number } = {}; //store count of values
  //  bar chart for techCategory
  public barChartTypeMostSuedTechAreas: 'bar' = 'bar';
  public barChartDataMostSuedTechAreas: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [], // Update with your actual data
        backgroundColor: [
          'rgba(255, 99, 71, 0.8)', // Adjust colors as needed
        ],
        borderColor: 'white',
        borderWidth: 2,
      },
    ],
  };
  public barChartOptionsMostSuedTechAreas: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true, // Ensures the y-axis starts at 0
        ticks: {
          color: '#000', // Dark color for X-axis labels
          font: {
            weight: 'bold', // Bold font
            size: 14, // Optional: control font size
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#000', // Dark color for X-axis labels
          font: {
            weight: 'bold', // Bold font
            size: 14, // Optional: control font size
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
    },
  };
  storeUniqueMostSuedTechAreas(): void {
    const mostSuedTechAreasData = this.filterDataForAnalytics
      .map((item) => item?.patentDetails?.techCategory)
      .filter((techCategory) => techCategory != null); // Filter out null or undefined values

    const splitCategories = mostSuedTechAreasData
      .flatMap((category) => category.split(/[\|,]/)) // Split by "|" or ","
      .map((subCategory) => subCategory.trim().toLowerCase()) // Normalize
      .filter((subCategory) => subCategory !== ''); // Exclude empty values

    const categoryCounts: { [key: string]: number } = splitCategories.reduce(
      (acc, category) => {
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {}
    );

    const sortedCategories = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1]
    );

    const topCategories = sortedCategories.slice(0, 10);
    const labels = topCategories.map(([category]) => category);
    const counts = topCategories.map(([, count]) => count);

    this.barChartDataMostSuedTechAreas.labels = labels;
    this.barChartDataMostSuedTechAreas.datasets[0].data = counts;

    this.updateChart();
    this.cdRef.detectChanges();
  }

  private updateChart(): void {
    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update(); // Refresh the chart
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is not initialized yet for Most Sued Tech Areas.');
      }
    }, 200); // Delay to ensure chart is ready
  }

  countMostSuedTechAreas(): void {
    // Initialize counts with unique tech areas
    this.countsMostSuedTechAreas = this.uniqueMostSuedTechAreas.reduce(
      (acc, techCategory) => {
        acc[techCategory.toLowerCase()] = 0; // Initialize count to 0
        return acc;
      },
      {}
    );

    // Count occurrences
    this.filterDataForAnalytics.forEach((item) => {
      const techCategory = item?.patentDetails?.techCategory || '';
      const categories = techCategory
        .split(/[\|,]/) // Split by delimiters
        .map((category: any) => category.trim().toLowerCase());

      categories.forEach((category: any) => {
        if (this.countsMostSuedTechAreas.hasOwnProperty(category)) {
          this.countsMostSuedTechAreas[category]++;
        }
      });
    });

    // Convert counts to chart data
    const countValues = this.uniqueMostSuedTechAreas.map(
      (techCategory) =>
        this.countsMostSuedTechAreas[techCategory.toLowerCase()] || 0
    );

    this.barChartDataMostSuedTechAreas.datasets[0].data = countValues;
    this.barChartDataMostSuedTechAreas.labels = this.uniqueMostSuedTechAreas;

    // Update chart
    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is not initialized yet for Most Sued Tech Areas.');
      }
    }, 200);
  }

  // MostSuedCompanies
  uniqueMostSuedCompanies: any[] = []; // Array to hold unique tech categories
  countsMostSuedCompanies: { [key: string]: number } = {}; //store count of values
  //  bar chart for techCategory
  // Define the type explicitly as "bar"
  // Pie chart for Most Sued Companies
  public mostSuedCompaniesChartType: ChartType = 'pie';
  public mostSuedCompaniesChartData: ChartData<
    'pie',
    number[],
    string | string[]
  > = {
    labels: [],
    datasets: [
      {
        data: [], // Data will be updated dynamically
        label: 'Most Sued Companies',
      },
    ],
  };

  public mostSuedCompaniesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, // Enable legend
        position: 'top', // Position legend at the top
      },
      tooltip: {
        enabled: true, // Enable tooltips for interactivity
      },
      datalabels: {
        display: true, // Disable data labels on the chart
      },
    },
    layout: {
      padding: {
        top: 0, // Add padding to reduce chart size
        bottom: 30,
      },
    },
  };

  updateMostSuedCompaniesChart(): void {
    const defendantData = this.filterDataForAnalytics
      .map((item) => item.legalEntities?.defendant)
      .filter(
        (defendant): defendant is string =>
          typeof defendant === 'string' && defendant.trim().length > 0
      );

    const counts = defendantData.reduce((acc, defendant) => {
      const normalized = defendant.trim().toLowerCase();
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedCounts = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Limit to top 10 companies

    const labels = sortedCounts.map(([label]) => label);
    const data = sortedCounts.map(([, count]) => count);

    this.mostSuedCompaniesChartData.labels = labels;
    this.mostSuedCompaniesChartData.datasets[0].data = data;

    console.log('Chart Labels:', labels);
    console.log('Chart Data:', data);

    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is not initialized yet for Most Sued Companies.');
      }
    }, 200);
  }

  //graph for industry
  uniqueIndustry: any[] = []; // Array to hold unique industry
  countsIndustry: { [key: string]: number } = {}; //store count of values
  //pia chart for industry
  public industryChartType: ChartType = 'pie';
  public industryChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Industry',
      },
    ],
  };
  public industryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, // Enable legend
        position: 'top', // Align legend to the left
        labels: {
          font: {
            size: 9, // Adjust font size for legend labels
          },
        },
      },
      tooltip: {
        enabled: true, // Enable tooltips for user interaction
      },
      datalabels: {
        display: true, // Disable data labels on the chart
      },
    },
    layout: {
      padding: {
        top: 0, // Add padding to reduce chart size
        bottom: 30,
      },
    },
  };

  storeUniqueIndustry(): void {
    const industryData = this.filterDataForAnalytics
      .map((item) => item.industry)
      .filter((industry) => industry != null); // Filter out null or undefined values
    const uniqueSet = new Set(
      industryData.map((industry) => industry.trim().toLowerCase())
    );
    // Assign unique values back to uniqueDefendantTypeAndSize
    this.uniqueIndustry = Array.from(uniqueSet);
    this.countIndustry();
  }

  countIndustry(): void {
    this.countsIndustry = this.uniqueIndustry.reduce((acc, industry) => {
      acc[industry.toLowerCase()] = 0; // Initialize count to 0
      return acc;
    }, {});

    this.filterDataForAnalytics.forEach((item) => {
      const type = item.industry?.toLowerCase();
      if (this.countsIndustry.hasOwnProperty(type)) {
        this.countsIndustry[type]++;
      }
    });

    // Convert counts to an array of values
    const countValuesIndustry = this.uniqueIndustry.map(
      (industry) => this.countsIndustry[industry.toLowerCase()] || 0
    );

    this.industryChartData.labels = this.uniqueIndustry;
    this.industryChartData.datasets[0].data = countValuesIndustry;

    // Update chart
    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
        this.cdRef.detectChanges();
      } else {
        console.warn('Chart is not initialized for Industry.');
      }
    }, 200);
  }

  uniqueList<T = any>(key: string): T[] {
    const extractedValues: T[] = this.excelData.map((item) => {
      // Dynamically access nested keys
      const keys = key.split('.');
      let value: any = item; // Start with the `data` field
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
  // Unique plaintiffs and their counts
  uniquePlaintiff: string[] = [];
  countsPlaintiff: { [key: string]: number } = {}; // Store count of values
  topPlaintiffs: { name: string; count: number }[] = []; // Store sorted plaintiffs with counts

  // Fetch all plaintiffs, handle duplicates, and count occurrences
  getAllPlaintiff() {
    // Extract values from the data
    const values = this.uniqueList(
      'legalEntities.plaintiffOrPetitioner'
    ).flatMap((entry: string | undefined) =>
      entry ? entry.split(',').map((item) => item.trim()) : []
    );

    // Count occurrences
    this.countsPlaintiff = values.reduce((acc, plaintiff) => {
      const name = plaintiff.toLowerCase();
      acc[name] = (acc[name] || 0) + 1; // Increment count or initialize to 1
      return acc;
    }, {} as { [key: string]: number });

    // Extract unique plaintiffs and sort them by count
    const sortedPlaintiffs = Object.entries(this.countsPlaintiff)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    // Assign sorted plaintiffs
    this.uniquePlaintiff = sortedPlaintiffs.map((item) => item.name);
    this.topPlaintiffs = sortedPlaintiffs;

    console.log('Unique Plaintiffs:', this.uniquePlaintiff);
    console.log('Top Plaintiffs with Counts:', this.topPlaintiffs);

    // Adjust the display
    this.onItemsToShowChangeInTopPlaitiff();
    this.updateFilteredAllPlaintiffs();
  }

  // Control how many items are shown in the UI
  itemsToShowInTopPlaintiff: string | number = 10; // Default value to show 10 items
  filteredTopPlaintiffs = this.topPlaintiffs.slice(0, 10); // Initial display

  // Update the filteredTopPlaintiffs based on user selection
  onItemsToShowChangeInTopPlaitiff() {
    if (this.itemsToShowInTopPlaintiff === 'all') {
      this.filteredTopPlaintiffs = this.topPlaintiffs;
    } else {
      const count = Number(this.itemsToShowInTopPlaintiff);
      this.filteredTopPlaintiffs = this.topPlaintiffs.slice(0, count);
    }
  }

  // All Plaintiffs with unique values
  filteredAllPlaintiffs: any[] = []; // Filtered list for display

  itemsToShowInAllPlaintiff: string | number = 10; // Default value to show 10 items

  // Update filtered plaintiffs based on user selection or initial state
  updateFilteredAllPlaintiffs() {
    if (this.itemsToShowInAllPlaintiff === 'all') {
      this.filteredAllPlaintiffs = this.uniquePlaintiff;
    } else {
      const count = Number(this.itemsToShowInAllPlaintiff);
      this.filteredAllPlaintiffs = this.uniquePlaintiff.slice(0, count);
    }
  }

  // Update filtered plaintiffs based on user selection
  onItemsToShowChangeInAllPlaitiff() {
    if (this.itemsToShowInAllPlaintiff === 'all') {
      this.filteredAllPlaintiffs = this.uniquePlaintiff;
    } else {
      const count = Number(this.itemsToShowInAllPlaintiff);
      this.filteredAllPlaintiffs = this.uniquePlaintiff.slice(0, count);
    }
  }

  // All Defendants with unique values and counts
  uniqueDefendent: string[] = []; // To hold unique defendant names
  filteredAllDefendent: string[] = []; // Filtered list for display
  countsDefendent: { [key: string]: number } = {}; // Store count of values
  topDefendent: { name: string; count: number }[] = []; // List of top defendants with counts

  itemsToShowInAllDefendent: string | number = 10; // Default value to show 10 items
  itemsToShowInTopDefendant: string | number = 10; // Default value to show 10 items

  // Extract and process all defendants
  getAllDefendent() {
    // Extract values using uniqueList and handle comma-separated entries
    const values = this.uniqueList('legalEntities.defendant').flatMap(
      (entry: string | undefined) =>
        entry ? entry.split(',').map((item) => item.trim()) : []
    );

    // Create a unique set of defendants
    const uniqueValuesSet = new Set(values.filter((value) => value));

    // Convert set to array and store it
    this.uniqueDefendent = Array.from(uniqueValuesSet);

    console.log('All Unique Defendants:', this.uniqueDefendent);

    // Initialize filtered defendants for display
    this.updateFilteredAllDefendent();

    // Proceed to calculate top defendants
    this.getTopDefendent();
  }

  // Update filtered list for "All Defendants" based on selection or initial state
  updateFilteredAllDefendent() {
    if (this.itemsToShowInAllDefendent === 'all') {
      this.filteredAllDefendent = this.uniqueDefendent;
    } else {
      const count = Number(this.itemsToShowInAllDefendent);
      this.filteredAllDefendent = this.uniqueDefendent.slice(0, count);
    }
  }

  // Adjust filtered list dynamically when selection changes
  onItemsToShowChangeInAllDefendent() {
    this.updateFilteredAllDefendent();
  }

  // Calculate top defendants with counts
  getTopDefendent() {
    // Initialize counts for each unique defendant
    this.countsDefendent = this.uniqueDefendent.reduce((acc, defendant) => {
      acc[defendant.toLowerCase()] = 0; // Set initial count to 0
      return acc;
    }, {} as { [key: string]: number });

    // Count occurrences of each defendant
    this.excelData.forEach((item) => {
      const defendants =
        typeof item.legalEntities?.defendant === 'string'
          ? item.legalEntities.defendant
              .split(',')
              .map((def: any) => def.trim().toLowerCase())
          : [];
      defendants.forEach((defendant: any) => {
        if (this.countsDefendent.hasOwnProperty(defendant)) {
          this.countsDefendent[defendant] += 1;
        }
      });
    });

    console.log('Defendant Counts:', this.countsDefendent);

    // Convert counts to array and sort to get top defendants
    this.topDefendent = Object.entries(this.countsDefendent)
      .map(([name, count]) => ({ name, count })) // Convert to array of objects
      .sort((a, b) => b.count - a.count); // Sort by count in descending order

    // Initialize filtered top defendants for display
    this.updateFilteredTopDefendant();
  }

  // Update filtered list for "Top Defendants" based on selection or initial state
  updateFilteredTopDefendant() {
    if (this.itemsToShowInTopDefendant === 'all') {
      this.filteredTopDefendant = this.topDefendent;
    } else {
      const count = Number(this.itemsToShowInTopDefendant);
      this.filteredTopDefendant = this.topDefendent.slice(0, count);
    }
  }

  // Adjust filtered list dynamically when selection changes
  onItemsToShowChangeInTopDefendant() {
    this.updateFilteredTopDefendant();
  }

  // Filtered list for top defendants
  filteredTopDefendant: { name: string; count: number }[] = [];

  //get all unique TopPlaintiffLawFirm
  uniquePlaintiffLawFirm: any[] = [];
  countsTopPlaintiffLawFirm: { [key: string]: number } = {}; //store count of values
  topPlaintiffLawFirm: { name: string; count: number }[] = [];
  getTopPlaintiffLawFirm() {
    const values = this.uniqueList('legalEntities.plaintiffsLawFirmName');
    this.uniquePlaintiffLawFirm = values;

    this.countsTopPlaintiffLawFirm = this.uniquePlaintiffLawFirm.reduce(
      (acc, plaintiffLawFirm) => {
        acc[plaintiffLawFirm.toLowerCase()] = 0; // Set initial count to 0
        return acc;
      },
      {}
    );

    // Count occurrences of each plaintiff
    this.excelData.forEach((item) => {
      const type = item.legalEntities?.plaintiffsLawFirmName?.toLowerCase();
      if (this.countsTopPlaintiffLawFirm.hasOwnProperty(type)) {
        this.countsTopPlaintiffLawFirm[type] += 1;
      }
    });
    // console.log(this.countsTopPlaintiffLawFirm);

    // Get top 3 plaintiffs
    this.topPlaintiffLawFirm = Object.entries(this.countsTopPlaintiffLawFirm)
      .map(([name, count]) => ({ name, count })) // Convert to array of objects
      .sort((a, b) => b.count - a.count); // Sort by count descending
    //  .slice(0, 3); // Get top 3

    //  console.log(this.top25Defendent);
    this.onItemsToShowChangeInTopPlaintiffLawFirm();
  }
  itemsToShowInTopPlaintiffLawFirm: string | number = 10; // Default value to show 3 items
  filteredTopPlaintiffLawFirm = this.topPlaintiffLawFirm.slice(0, 10); // Start with first 3 items
  onItemsToShowChangeInTopPlaintiffLawFirm() {
    if (this.itemsToShowInTopPlaintiffLawFirm === 'all') {
      this.filteredTopPlaintiffLawFirm = this.topPlaintiffLawFirm;
    } else {
      const count = Number(this.itemsToShowInTopPlaintiffLawFirm);
      this.filteredTopPlaintiffLawFirm = this.topPlaintiffLawFirm.slice(
        0,
        count
      );
    }
  }

  //get all unique DefendantLawFirm
  uniqueDefendantLawFirm: any[] = [];
  countsTopDefendantLawFirm: { [key: string]: number } = {}; //store count of values
  topDefendantLawFirm: { name: string; count: number }[] = [];
  getTopDefendantLawFirm() {
    const values = this.uniqueList('legalEntities.defendantLawFirmName');
    this.uniqueDefendantLawFirm = values;

    this.countsTopDefendantLawFirm = this.uniqueDefendantLawFirm.reduce(
      (acc, defendantLawFirmName) => {
        acc[defendantLawFirmName.toLowerCase()] = 0; // Set initial count to 0
        return acc;
      },
      {}
    );

    // Count occurrences of each plaintiff
    this.excelData.forEach((item) => {
      const type = item.legalEntities?.defendantLawFirmName?.toLowerCase();
      if (this.countsTopDefendantLawFirm.hasOwnProperty(type)) {
        this.countsTopDefendantLawFirm[type] += 1;
      }
    });
    console.log(this.countsTopDefendantLawFirm);
    this.topDefendantLawFirm = Object.entries(this.countsTopDefendantLawFirm)
      .map(([name, count]) => ({ name, count })) // Convert to array of objects
      .sort((a, b) => b.count - a.count); // Sort by count descending
    this.onItemsToShowChangeInTopDefendentLawFirm();
  }
  itemsToShowInTopDefendentLawFirm: string | number = 10; // Default value to show 3 items
  filteredTopDefendentLawFirm = this.topDefendantLawFirm.slice(0, 10); // Start with first 3 items
  onItemsToShowChangeInTopDefendentLawFirm() {
    if (this.itemsToShowInTopDefendentLawFirm === 'all') {
      this.filteredTopDefendentLawFirm = this.topDefendantLawFirm;
    } else {
      const count = Number(this.itemsToShowInTopDefendentLawFirm);
      this.filteredTopDefendentLawFirm = this.topDefendantLawFirm.slice(
        0,
        count
      );
    }
  }

  //get all Overlapping Law Firm
  OverlappingLawFirm: any[] = [];
  getOverlappingLawFirm() {
    const combinedLawFirms = [
      ...this.uniqueDefendantLawFirm,
      ...this.uniquePlaintiffLawFirm,
    ];

    const uniqueLawFirmsSet = new Set(
      combinedLawFirms.map((firm) => firm.toLowerCase().trim())
    );

    this.OverlappingLawFirm = Array.from(uniqueLawFirmsSet);
    this.onItemsToShowChangeInOverlappingLawFirm();
  }
  itemsToShowInOverlappingLawFirm: string | number = 10; // Default value to show 3 items
  filteredOverlappingLawFirm = this.OverlappingLawFirm.slice(0, 10); // Start with first 3 items
  onItemsToShowChangeInOverlappingLawFirm() {
    if (this.itemsToShowInOverlappingLawFirm === 'all') {
      this.filteredOverlappingLawFirm = this.OverlappingLawFirm;
    } else {
      const count = Number(this.itemsToShowInOverlappingLawFirm);
      this.filteredOverlappingLawFirm = this.OverlappingLawFirm.slice(0, count);
    }
  }

  //pia chart for Total cases transferred from OC to NPE
  public casesTransferredFromOCToNPEChartType: ChartType = 'pie';
  public casesTransferredFromOCToNPEChartData: ChartData<
    'pie',
    number[],
    string | string[]
  > = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Total Cases Transferred From OC To NPE',
        backgroundColor: ['#FF6384', '#36A2EB'],
        borderWidth: 1,
      },
    ],
  };
  public casesTransferredFromOCToNPEChartOptions: ChartConfiguration['options'] =
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          enabled: true,
        },
        datalabels: {
          display: true,
        },
      },
    };

  getCasesTransferredFromOCToNPE() {
    let transferCount = 0;

    this.excelData.forEach((item, index) => {
      // Split original and current assignees by "|"
      const originalAssignees = item?.patentDetails?.originalAssignee
        ?.toLowerCase()
        .split('|')
        .map((assignee: any) => assignee.trim());
      const currentAssignees = item?.patentDetails?.currentAssignee
        ?.toLowerCase()
        .split('|')
        .map((assignee: any) => assignee.trim());

      // Log both lists
      // console.log(`Case Index: ${index}`);
      // console.log(`Original Assignees:`, originalAssignees);
      // console.log(`Current Assignees:`, currentAssignees);

      if (originalAssignees && currentAssignees) {
        // Normalize and compare
        const normalizeAssignee = (assignee: string) =>
          assignee.replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric characters

        const normalizedOriginal = originalAssignees.map(normalizeAssignee);
        const normalizedCurrent = currentAssignees.map(normalizeAssignee);

        // Check for any direct match (original becomes current)
        const hasTransfer = normalizedOriginal.some((original: any) =>
          normalizedCurrent.includes(original)
        );

        if (hasTransfer) {
          // console.log(
          //   `Transfer Found: Original = ${originalAssignees}, Current = ${currentAssignees}`
          // );
          transferCount++;
        }
      }
    });

    // Update the chart data
    this.casesTransferredFromOCToNPEChartData.datasets[0].data = [
      transferCount,
    ];
    this.casesTransferredFromOCToNPEChartData.labels = [
      'Transferred OC to NPE',
    ];
    console.log(`Total cases transferred from OC to NPE: ${transferCount}`);
  }

  originalAssignee: string[] = [];
  currentAssignee: string[] = [];

  getAllOriginalAndCurrentAssigne() {
    this.excelData.forEach((item) => {
      const original = item.patentDetails?.originalAssignee?.toLowerCase();
      const current = item.patentDetails?.currentAssigne?.toLowerCase();

      this.originalAssignee.push(original);
      this.currentAssignee.push(current);

      let differenceCount = 0;

      // Determine the maximum length to compare
      const maxLength = Math.max(
        this.originalAssignee.length,
        this.currentAssignee.length
      );

      for (let i = 0; i < maxLength; i++) {
        const original = this.originalAssignee[i]; // Can be string or undefined
        const current = this.currentAssignee[i]; // Can be string or undefined

        // Skip undefined values
        if (original === undefined || current === undefined) {
          continue; // Skip to the next iteration if either value is undefined
        }

        // Compare corresponding defined values
        if (original.trim().toLowerCase() !== current.trim().toLowerCase()) {
          differenceCount++;
          console.log(
            `Difference at index ${i}: Original = "${original}", Current = "${current}"`
          );
        }
      }
      this.casesTransferredFromOCToNPEChartData.datasets[0].data = [
        differenceCount,
      ];

      return differenceCount;
    });
  }
}
