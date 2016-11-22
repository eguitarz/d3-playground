import Ember from 'ember';
import d3Format from 'd3-format';
import { scaleQuantize } from 'd3-scale';
import { range } from 'd3-array';
import { select } from 'd3-selection';
import { timeFormat } from 'd3-time-format';
import { timeDays, timeMonths, timeWeek, timeYear } from 'd3-time';
import { csv } from 'd3-request';
import { nest } from 'd3-collection';

export default Ember.Component.extend({
  didInsertElement() {
    let width = 960,
        height = 136,
        cellSize = 17; // cell size

    let percent = d3Format.format(".1%"),
        format = timeFormat("%Y-%m-%d");

    let color = scaleQuantize()
        .domain([-0.05, 0.05])
        .range(range(11).map(function(d) { return "q" + d + "-11"; }));

    let svg = select("body").selectAll("svg")
        .data(range(1990, 2011))
      .enter().append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "RdYlGn")
      .append("g")
        .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

    svg.append("text")
      .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
      .style("text-anchor", "middle")
      .text(function(d) { return d; });

    let rect = svg.selectAll(".day")
        .data(function(d) { return timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter().append("rect")
        .attr("class", "day")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", function(d) { return timeWeek.count(timeYear(d), d) * cellSize; })
        .attr("y", function(d) { return d.getDay() * cellSize; })
        .datum(format);

    rect.append("title")
        .text(function(d) { return d; });

    svg.selectAll(".month")
        .data(function(d) { return timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter().append("path")
        .attr("class", "month")
        .attr("d", monthPath);

    csv("dji.csv", function(error, csv) {
      if (error) { throw error; }

      let data = nest()
        .key(function(d) { return d.Date; })
        .rollup(function(d) { return (d[0].Close - d[0].Open) / d[0].Open; })
        .object(csv);

      rect.filter(function(d) { return d in data; })
        .attr("class", function(d) { return "day " + color(data[d]); })
        .select("title")
        .text(function(d) { return d + ": " + percent(data[d]); });
    });

    function monthPath(t0) {
      let t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
        d0 = t0.getDay(), w0 = timeWeek.count(timeYear(t0), t0),
        d1 = t1.getDay(), w1 = timeWeek.count(timeYear(t1), t1);
      return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize +
        "H" + w0 * cellSize + "V" + 7 * cellSize +
        "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize +
        "H" + (w1 + 1) * cellSize + "V" + 0 +
        "H" + (w0 + 1) * cellSize + "Z";
    }
  }
});
