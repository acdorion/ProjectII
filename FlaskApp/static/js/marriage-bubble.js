// Chart params
var svgWidth = 900;
var svgHeight = 550;

var margin ={
    top: 20,
    right: 40,
    bottom: 100,
    left: 20
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart, and shift the latter by left and top margins.
var svg = d3.select("#bubble-mr")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", "translate(0,0)")

var defs = svg.append("defs");

defs.append("pattern")
    .attr("id", "wedding-rings")
    .attr("height", "100%")
    .attr("width", "100%")
    .attr("patternContentUnits", "objectBoundingBox")
    .append("image")
    .attr("height", 1)
    .attr("width", 1)
    .attr("preserveAspectRatio", "none")
    .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
    .attr("xlink:href", "static/wedding-rings.jpg")

   
// Scale the circles
var radiusScale = d3.scaleSqrt().domain([5, 30]).range([10, 80])

// Define combine/separate forces
var forceXCombine = d3.forceX(width / 2).strength(0.05)

var forceXSeparate = d3.forceX(function(d){
    if (d.party === 'democrat'){
        return 250
    } else {
        return 750
    }
}).strength(0.05)

// Use the Force/prevent collisions
var simulation = d3.forceSimulation()
.force("x", forceXCombine)
.force("y", d3.forceY(height / 2).strength(0.05))
.force("collide", d3.forceCollide(function(d){
    return radiusScale(d.rate) + 1;
}))

// Import Data
var file = "https://raw.githubusercontent.com/avangemert/interactive-d3-bubble-chart/master/assets/data/data.csv"
d3.csv(file).then(successHandle, errorHandle);

function errorHandle(error){
    throw err;
}

function successHandle(marriageData){

    // Print the healthData
    console.log(marriageData);

    // Scale the circles
    var radiusScale = d3.scaleSqrt().domain([5, 30]).range([10, 80])

    // Initialize tooltip
    var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .html(function(d) {
        return(`<h6>${d.state}</h6>Marriage Rate: ${d.rate}`);});
    
    // Create tooltip in the chart
    svg.call(toolTip);

    // Create circles
    var circles = svg.selectAll(".state")
    .data(marriageData)
    .enter()
    .append("circle")
    .attr("class", "state")
    .attr("r", function(d){
        return radiusScale(d.rate);
    })
    .attr("fill", function(d){
        return "url(#wedding-rings)"
    })
    .on('click', function(d){
        toolTip.show(d, event.target)
            .direction("n");
    }).on("mouseout", function(d, index){
        toolTip.hide(d, event.target);
    });

    defs.selectAll(".state-flower-pattern")
    .data(marriageData)
    .enter().append("pattern")
    .attr("class", "state-flower-pattern")
    .attr("id", "wedding-rings")
    .attr("height", "100%")
    .attr("width", "100%")
    .attr("patternContentUnits", "objectBoundingBox")
    .append("image")
    .attr("height", 1)
    .attr("width", 1)
    .attr("preserveAspectRatio", "none")
    .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
    .attr("xlink:href", "static/wedding-rings.jpg")

    // Event listeners for buttons
    d3.select("#party-mr").on('click', function() {
        simulation
        .force("x", forceXSeparate)
        .alphaTarget(0.3)
        .restart()
    })

    d3.select("#combine-mr").on('click', function() {
        simulation
        .force("x", forceXCombine)
        .alphaTarget(0.2)
        .restart()
    })

    simulation.nodes(marriageData)
    .on('tick', ticked)

    function ticked(){
        circles
        .attr("cx", function(d){
            return d.x
        })
        .attr("cy", function(d){
            return d.y
        })
    }

    
   
}
