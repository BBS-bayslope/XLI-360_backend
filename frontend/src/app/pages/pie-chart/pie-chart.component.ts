import { Component, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Pie } from '@antv/g2plot';

interface ChartData {
  region: string;
  qty: number;
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  template: `<div class="pie-chart-container"></div>`,
  styles: [`
    .pie-chart-container {
      // width: 100%;
      // height: 450px;
      padding: 5px;
    }
  `]
})
export class PieChartComponent implements OnChanges {
  @Input() data: ChartData[] = [];

  private piePlot!: Pie;

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data.length > 0) {
      console.log('PieChart me mila hua data:', this.data);
      this.renderChart();
    }
  }

  private renderChart() {
    const container = this.el.nativeElement.querySelector('.pie-chart-container');

     const top10Data = [...this.data]
       .sort((a, b) => b.qty - a.qty)
       .slice(0, 10);

    if (this.piePlot) {
      this.piePlot.changeData(top10Data); // Update data if chart already exists
    } else {
      this.piePlot = new Pie(container, {
        appendPadding: 10,
        data: top10Data,
        angleField: 'qty',
        colorField: 'region',
        radius: 0.7,
        label: {
          type: 'spider',
          labelHeight: 20,
          content: (data) =>
            `${(data as ChartData).region}: ${(data as ChartData).qty}`,
          style: {
            fontWeight: 'bold', // Make the label text bold
            fill: '#000000', // Set the label text color to black
          },
        },
        interactions: [{ type: 'element-active' }],
        legend: {
          layout: 'horizontal',
          position: 'bottom',
          itemName: {
            style: {
              fontWeight: 'bold',
              fill: '#000000',
              fontSize: 12,
            },
          },
        },
      });

      this.piePlot.render();
    }
  }
}
