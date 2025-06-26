import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import { Bar } from '@antv/g2plot';

@Component({
  selector: 'app-stacked-bar-chart',
  standalone: true,
  template: '<div #chartContainer></div>',
  styleUrls: [],
})
export class StackedBarChartComponent implements OnChanges {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() data: any[] = [];
  private stackedBarPlot!: Bar;

  ngOnChanges(): void {
    if (this.data && this.data.length) {
      this.renderChart();
    }
  }

  private renderChart(): void {
    const transformedData = this.data.flatMap((firm) => [
      {
        law_firm:
          firm.entity.length > 30
            ? firm.entity.split(',')[0] + '...'
            : firm.entity,
        type: 'Plaintiff Cases',
        value: firm.plaintiff_case_count,
      },
      {
        law_firm:
          firm.entity.length > 30
            ? firm.entity.split(',')[0] + '...'
            : firm.entity,
        type: 'Defendant Cases',
        value: firm.defendant_case_count,
      },
    ]);

    if (!this.stackedBarPlot) {
      this.stackedBarPlot = new Bar(this.chartContainer.nativeElement, {
        data: transformedData,
        isStack: true,
        xField: 'value',
        yField: 'law_firm',
        seriesField: 'type',
        legend: {
          layout: 'horizontal',
          position: 'bottom',
        },
        label: {
          position: 'middle',
          layout: [
            { type: 'interval-adjust-position' },
            { type: 'interval-hide-overlap' },
            { type: 'adjust-color' },
          ],
          style: {
            fontWeight: 'bold',
            fill: '#000',
            fontSize: 12,
          },
        },
        yAxis: {
          label: {
            style: {
              fontWeight: 'bold',
              fill: '#333',
              fontSize: 14,
            },
          },
        },
        xAxis: {
          label: {
            style: {
              fill: '#444',
              fontSize: 12,
            },
          },
        },
        interactions: [{ type: 'element-active' }],
      });

      this.stackedBarPlot.render();
    } else {
      this.stackedBarPlot.changeData(transformedData);
    }
  }
}