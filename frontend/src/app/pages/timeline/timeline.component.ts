import { Component, ElementRef, Input, OnInit, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-timeline',
  standalone: true,
  template: `<div #timeline></div>`,
  styles: [`
    div {
      width: 100%;
    }
  `]
})
export class TimelineComponent implements OnChanges {
  @ViewChild('timeline', { static: true }) timelineContainer!: ElementRef;
  @Input() data: { date: Date; label: string }[] = [];
  @Input() startDate: Date = new Date(2024, 11, 1);
  @Input() endDate: Date = new Date(2026, 11, 1);

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data.length > 0) {
      this.data = this.data.map((d: any) => ({
        date: this.parseDate(d.date),  // Convert '15/03/2024' to Date object
        label: d.label
      }));

      this.startDate = this.data[0].date;

      if (this.data.length === 1) {
        // If only one data point, set endDate to 1 year ahead
        this.endDate = new Date(this.startDate);
        this.endDate.setFullYear(this.endDate.getFullYear() + 1);
      } else {
        this.endDate = this.data[this.data.length - 1].date;
      }

      this.createTimeline();
    }

  }

  parseDate(dateStr: string): Date {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date(); // Fallback

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
  }
  createTimeline() {
    if (!this.data.length) return;
    // console.log(this.data, "dekho")
    const margin = { top: 0, right: 30, bottom: 0, left: 30 };
    const width = 900 - margin.left - margin.right;
    const height = 100 - margin.top - margin.bottom;

    const svg = d3.select(this.timelineContainer.nativeElement)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // scale for the timeline
    const xScale = d3.scaleTime()
      .domain([this.startDate, this.endDate])
      .range([0, width]);

    const formatTime = d3.timeFormat('%Y');

    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeYear)
      .tickFormat((domainValue: Date | d3.NumberValue, index: number) => {
        if (domainValue instanceof Date) {
          return formatTime(domainValue);
        }
        return '';
      });

    svg.append("g")
      .attr("transform", `translate(0, ${height / 2})`)
      .call(xAxis);

    // Timeline line
    svg.append("line")
      .attr("x1", 0)
      .attr("y1", height / 2)
      .attr("x2", width)
      .attr("y2", height / 2)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);

    const tooltip = d3.select(this.timelineContainer.nativeElement)
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "white")
      .style("border", "1px solid black")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("font-size", "12px");

    // Map events
    this.data.forEach((d) => {
      const xPos = xScale(d.date);

      // Draw circle
      svg.append("circle")
        .attr("cx", xPos)
        .attr("cy", height / 2)
        .attr("r", 8)
        .style("fill", "steelblue")
        .on("mouseover", (event) => {
          tooltip.style("visibility", "visible")
            .html(`<strong>Date:</strong> ${d3.timeFormat("%b, %Y")(d.date)}<br><strong>Event:</strong> ${d.label}`);
        })
        .on("mousemove", (event) => {
          tooltip.style("top", `${event.pageY - 30}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
          tooltip.style("visibility", "hidden");
        });
    });
  }
}
