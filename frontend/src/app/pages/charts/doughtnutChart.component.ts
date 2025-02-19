import { Component, ElementRef, Input, OnChanges, ViewChild, AfterViewInit } from '@angular/core';
import { Pie } from '@antv/g2plot';

@Component({
  selector: 'app-doughtnut-chart',
  standalone:true,
  template: `<div #chartContainer></div>`,
  styleUrls: []
})
export class DoughnutChartComponent implements OnChanges, AfterViewInit {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  @Input() data: { type: string; value: number }[] = [];
  @Input() innerRadius: number = 0.55; // Default value
  @Input() titleContent: any = 'Total';

  private piePlot!: Pie;

  ngAfterViewInit() {
    this.renderChart();
  }

  ngOnChanges() {
    if (this.piePlot) {
      this.piePlot.changeData(this.data);
    }
  }

  private renderChart() {
    if (!this.chartContainer || !this.data.length) return;

    this.piePlot = new Pie(this.chartContainer.nativeElement, {
      appendPadding: 10,
      data: this.data,
      angleField: 'value',
      colorField: 'type',
      radius: 0.7,
      innerRadius: this.innerRadius,
      label: {
        type: 'inner',
        offset: '-50%',
        // content: ({ value }) => value.toString(),
        content:'',
        style: {
          textAlign: 'center',
          fontSize: 14,
        },
      },
      interactions: [{ type: 'element-selected' }, { type: 'element-active' }],
      statistic: {
        title: false,
        content: {
          style: {
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
          content: this.titleContent,
        },
      },
    });

    this.piePlot.render();
  }
}
