
var svgWidth = 960;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 20,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;


// D3 Projection
var projection = d3.geo.albersUsa()
				   .translate([width/2, height/2])    // translate to center of screen
				   .scale([1000]);          // scale things down so see entire US

// Define path generator
var path = d3.geo.path()               // path generator that will convert GeoJSON to SVG paths
		  	 .projection(projection);  // tell path generator to use albersUsa projection


// Define linear scale for output
// var color1 = d3.scale.linear()
// 			  .range(["#ebfaeb",
//                   "#c2f0c2",
//                   "#99e699",
//                   "#5cd65c",
//                   "#33cc33",
//                   "#29a329",
//                   "#0f3d0f"]);

var color = function scale(d) {
        return d < 1 ? '#ebfaeb' :
                d < 2  ? '#c2f0c2' :
                  d < 4  ? '#99e699' :
                    d < 6  ? '#5cd65c' :
                        d < 8  ? '#33cc33' :
                            d< 10 ? '#29a329':
                                '#145214'
    };

// var colors = ['#ebfaeb', '#c2f0c2','#99e699', '#5cd65c','#33cc33','#29a329','#145214'];
var colorsRange = [0,1,2,4,6,8,10];
var legendText = ["0-1","1-2","2-4","4-6","6-8","8-10",">10"];


// Append Div for tooltip to SVG
var toolTip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);



function buildMap(year) {
    // Remove older SVG
    d3.select("#map svg").remove();
    d3.select(".legend").remove();

    //Create SVG element and append map to the SVG
    var svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Load in my states data!
    var marriageRatesAndStatesUrl = `/metadata/year/${year}`;
    d3.json(marriageRatesAndStatesUrl, function (data) {
        console.log('state data', data);
        var marriage_rates = data.marriage_rates;
        var states = data.state;

        // color.domain([0, 2, 4, 6, 8, 10, 100]); // setting the range of the input data

        // Load GeoJSON data and merge with states data
        var usMapUrl = "https://gist.githubusercontent.com/michellechandra/0b2ce4923dc9b5809922/raw/a476b9098ba0244718b496697c5b350460d32f99/us-states.json";
        d3.json(usMapUrl, function (json) {
            console.log('json state', json);
            // Loop through each state data value in the .csv file
            for (var i = 0; i < data.states.length; i++) {

                // Grab State Name
                var dataState = data.states[i];

                // Grab data value
                var dataValue = data.marriage_rates[i];

                // Find the corresponding state inside the GeoJSON
                for (var j = 0; j < json.features.length; j++) {
                    var jsonState = json.features[j].properties.name;

                    if (dataState == jsonState) {

                        // Copy the data value into the JSON
                        json.features[j].properties.marriage_rates = dataValue;

                        // Stop looking through the JSON
                        break;
                    }
                }
            }

            // Bind the data to the SVG and create one path per GeoJSON feature

            svg.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("stroke", "#fff")
                .style("stroke-width", "1")
                .style("fill", function (d) {
                    var value = d.properties.marriage_rates;

                    if (value) {
                        //If value exists…
                        return color(value);
                    } else {
                        //If value is undefined…
                        return "rgb(213,222,217)";
                    }
                })
                .on("mouseover", function (d) {
                    toolTip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    toolTip.html(`<strong>${d.properties.name}</strong>
                                <p>${d.properties.marriage_rates}</p>`)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })

                // fade out tooltip on mouse out
                .on("mouseout", function (d) {
                    toolTip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            var legend = d3.select("#map").append("svg")
                .attr("class", "legend")
                .attr("width", 140)
                .attr("height", 200)
                .selectAll("g")
                .data(colorsRange)
                .enter()
                .append("g")
                .attr("transform", function (d, i) {
                    return "translate(0," + i * 20 + ")";
                });

            legend.append("rect")
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", color);

            legend.append("text")
                .data(legendText)
                .attr("x", 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .text(function (d) {
                    return d;
                });

        });
    });

}


function init() {

    // Set up the dropdown menu
    // Grab a reference to the dropdown select element
    var selector = d3.select("#selYear");

    // Use the list of sample names to populate the select options
    d3.json("/years", years => {
            years.forEach((instance) => {
            selector
            .append("option")
            .text(instance)
            .property("value", instance);
            });

        // Use Alabama to build the initial plot
        const defaultYear = years[0];
        buildMap(defaultYear);
    });
}

function yearChanged(newYear) {
    // Fetch new data each time a new state is selected
    buildMap(newYear);
}

init();