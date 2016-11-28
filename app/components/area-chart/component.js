import Ember from 'ember';
import d3Format from 'd3-format';
import { scaleQuantize, scaleTime, scaleLinear } from 'd3-scale';
import { range, extent, max, bisector } from 'd3-array';
import { select, mouse } from 'd3-selection';
import { timeFormat, timeParse } from 'd3-time-format';
import { timeDays, timeMonths, timeWeek, timeYear } from 'd3-time';
import { csv, json } from 'd3-request';
import { nest } from 'd3-collection';
import { axisBottom, axisLeft } from 'd3-axis';
import { area, line } from 'd3-shape';

export default Ember.Component.extend({
  didInsertElement() {
    var margin = {top: 60, right: 20, bottom: 30, left: 110},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    let parseDate = timeFormat("%Y-%m-%d");

    let x = scaleTime().range([0, width]);
    let y = scaleLinear().range([height, 0]);
    let x2 = scaleTime().range([0, width]);
    let y2 = scaleLinear().range([height, 0]);

    let xAxis = axisBottom(x);
    let yAxis = axisLeft(y);
    let y2Axis = axisLeft(y2);

    let theArea = area()
      .x(d => x(d.date))
      .y0(height)
      .y1(d => y(d.volume));
    let theLine = line()
      .x(d => x2(d.date))
      .y(d => y2(d.close));

    var svg = select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const url = 'https://crossorigin.me/https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1440';
    json(url, (error, { result: { XXBTZUSD: series } }) => {
      if (error) { throw error; }

      series = series.map(d => ({
        date: new Date(d[0] * 1000),
        close: +d[4],
        volume: +d[7]
      }));

      let bisectDate = bisector(function(d) { return d.date; }).left;
      let formatValue = d3Format.format(",.2f");
      let formatCurrency = function(d) { return "$" + formatValue(d); };

      function mousemove() {
        var x0 = x2.invert(mouse(this)[0]),
        i = bisectDate(series, x0, 1),
        d0 = series[i - 1],
        d1 = series[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x2(d.date) + "," + y2(d.close) + ")");
        focus.select("text").text(formatCurrency(d.close));
      }

      x.domain(extent(series, d => d.date));
      y.domain([0, max(series, d => d.volume)]);
      x2.domain(extent(series, d => d.date));
      y2.domain(extent(series, d => d.close));

      svg.append("text")
        .attr('transform', 'translate(-90,-20)')
        .attr('font-size', '2em')
        .text('Volume and Price');

      svg.append("path")
          .datum(series)
          .attr("class", "area")
          .attr("d", theArea);

      svg.append("path")
          .datum(series)
          .attr("class", "line")
          .attr("d", theLine);

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .style('fill', 'steelblue')
          .text("Volume");

      svg.append("g")
          .attr("class", "y2 axis")
          .attr('transform', 'translate(-60,0)')
          .call(y2Axis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .style('fill', 'gold')
          .text("Price ($)");

      // focus
      var focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

      focus.append("circle")
         .attr("r", 4.5);

      focus.append("text")
         .attr("x", 9)
         .attr("dy", ".35em");

      svg.append("rect")
         .attr("class", "overlay")
         .attr("width", width)
         .attr("height", height)
         .on("mouseover", function() { focus.style("display", null); })
         .on("mouseout", function() { focus.style("display", "none"); })
         .on("mousemove", mousemove);

    });
  }
});
