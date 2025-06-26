import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pie } from '@antv/g2plot';

interface ChartData {
  region: string;
  qty: number;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
})
export class DonutChartComponent implements OnChanges {
  @Input() data: ChartData[] = [];

  private piePlot!: Pie;

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data.length > 0) {
      this.renderChart();
    }
  }

  private renderChart() {
    const container = this.el.nativeElement.querySelector(
      '.donut-chart-container'
    );

    const total = this.data.reduce((sum, item) => sum + item.qty, 0);

    if (this.piePlot) {
      this.piePlot.changeData(this.data);
    } else {
      this.piePlot = new Pie(container, {
        data: this.data,
        appendPadding: 20,
        angleField: 'qty',
        colorField: 'region',
        radius: 0.8,
        innerRadius: 0.6,
        animation: true,
        color: [
          '#5B8FF9',
          '#61DDAA',
          '#65789B',
          '#F6BD16',
          '#7262fd',
          '#78D3F8',
          '#9661BC',
          '#F6903D',
          '#008685',
        ],
        label: {
          type: 'spider',
          labelHeight: 24,
          content: '{name}\n{percentage}',
          style: {
            fill: '#333',
            fontSize: 13,
            fontWeight: 'bold',
          },
        },
        legend: {
          position: 'bottom',
          itemName: {
            style: {
              fontSize: 11,
              fontWeight: 600,
              fill: '#333',
            },
          },
        },
        tooltip: {
          showTitle: false,
          
          showMarkers: false,
          itemTpl:
            '<li style="margin-bottom:4px;">' +
            '<span style="background-color:{color};" class="g2-tooltip-marker"></span>' +
            '{name}: {value} ({percentage})</li>',
        },
        statistic: {
          title: {
            customHtml: () => 'Total',
            style: {
              fontSize: '16',
              fontWeight: 'bold',
              color: '#aaa',
            },
          },
          content: {
            customHtml: () => `${total}`,
            style: {
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#333',
            },
          },
        },
        interactions: [
          { type: 'element-selected' },
          { type: 'element-active' },
        ],
        state: {
          active: {
            style: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
              stroke: '#000',
              lineWidth: 1,
            },
          },
        },
      });

      this.piePlot.render();
    }
  }
}
