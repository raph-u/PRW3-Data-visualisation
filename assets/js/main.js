$(function() {
    // Canvas dimensions
    var width = $(window).width(), height = 500;

    // Maps canton names and colors
    var colors = {
        'vaud': 'green',
        'fribourg': 'black',
        'valais': 'red',
        'tessin': 'blue',
        'genève': 'yellow'
    };

    // Elements displaying info about data e.g. weekdays, time, etc.
    var layoutElements = {
        'full': $('#full'),
        'weekDays': $('.weekDay'),
        'dayHalves': $('.dayHalfPeriod'),
        'hours': $('.hourRange')
    };

    var smsButton = $('#smsButton');
    var callsButton = $('#callsButton');
    var downloadsButton = $('#downloadsButton');

    var resetCantonFilter = $('.resetCanton');

    var bodyDefaultMargin = parseInt($('body').css('margin'));

    // Maps weekdays and their position
    // Structure : {'Day' : <center coordinates>};
    var weekDaysXCoordinates = getXaxisCenters(layoutElements.weekDays);
    // var weekDaysYCoordinates = getYaxisCenters(layoutElements['weekDays'].first());

    var dayNightXCoordinates = getXaxisCenters(layoutElements.dayHalves);
    // var dayNightYCoordinates = getYaxisCenters(layoutElements['dayHalves'].first());

    var hoursXCoordinates = getXaxisCenters(layoutElements.hours);
    var hoursYCoordinates = getYaxisCenters(layoutElements.hours);

    var forceY = d3.forceY(function(d) {
        return height / 2;
    }).strength(baseForceStrength);


    // spacing between each circles
    var circleSpacing = 3;
    var nudge = 0.4;
    var baseForceStrength = 0.045;


    // Returns the center position (x-axis) of the given divs
    function getXaxisCenters(elements) {
        var coordinates = {};

        elements.each(function() {
            var currentElement = $(this);
            var start = currentElement.position().left - bodyDefaultMargin;
            var width = this.offsetWidth;
            // var end = start + width;

            var child = currentElement.children().first();
            var text = child.text().toLowerCase();
            
            coordinates[text] = start + (width / 2);
        }); 

        return coordinates;
    }

    function getYaxisCenters(elements) {
        var coordinates = {};

        elements.each(function() {
            var currentElement = this;

            // Position relative to the parent container
            var offset = currentElement.offsetTop;

            var height = currentElement.offsetHeight;
            // var end = start + width;

            var child = $(currentElement).children().first();
            var text = child.text().toLowerCase();

            coordinates[text] = offset + (height / 2);
        });

        return coordinates;
    }

    // Hides / shows the list of elements provided by the list using opacity
    // except the one specified by exception (class or id)
    function setElementsOpacity(collection, value, exception = "") {
        _.each(layoutElements, function(elementCollection, collectionKey) {
            if (collectionKey !== exception) {
                elementCollection.each(function() {
                    var currentElement = $(this);
                    currentElement.css('visibility', value);
                });
            }
        });
    }

    // Add elements to the structure that will hold circles
    var svg = d3.select('#chart')
        // Add a squared svg container
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        // Add a group
        .append('g')
        .attr('transform', 'translate(0, 0)')

    var jqSvgElement = $(svg['_groups'][0]).parent();

    // 13 = lowest / 209 = biggest
    // The range specifies how small and big circles will get
    // In this case, the smallest will have a r of 10, while the biggest will be 80
    var radiusScale = d3.scaleSqrt().domain([13, 240]).range([5, 15]);

    var forceWeekdaysXSplit = d3.forceX(function(d) {
        return weekDaysXCoordinates[d.day];
    }).strength(baseForceStrength);

    var forceDayNightXSplit = d3.forceX(function(d) {
        return dayNightXCoordinates[d.dayPeriod];
    }).strength(baseForceStrength);

    // DOING...
    var forceHoursX = d3.forceX(function(d) {
        return hoursXCoordinates[d.hourRange];
    }).strength(baseForceStrength);

    var forceHoursY = d3.forceY(function(d) {
        return hoursYCoordinates[d.hourRange];
    }).strength(baseForceStrength);

    var forceXCombine = d3.forceX(width / 2).strength(baseForceStrength);

    var forceYBase = d3.forceY(function(d) {
        return height / 2;
    }).strength(baseForceStrength);

    var forceCollide =  d3.forceCollide(function(d) {
        // Set the collision force to be adapted to the radius scale
        return radiusScale(d.smsCount) + circleSpacing;
    });

    // Applies a force to every circle
    // In fact, it is a collection of forces 
    // about where we want our circles to go and how they interact
    var simulation = d3.forceSimulation()
        // Define the forces to be applied to our circles
        // Each force has a identifier (first param) so that they can be edited in future

        // Apply an X-axis force
        .force('x', forceXCombine)
        // // Apply an Y-axis force
        .force('y', forceYBase)

        // // Alt to X n Y forces

        // .force('center', d3.forceCenter(width / 2, height / 2))

        .force('charge', d3.forceManyBody().strength(1))


        // Apply a force that prevents circles from overlapping on top of each other
        // the parameter specifies the radius of space
        // NO overlap occur for as long as the radius is the same as the circle's
        .force('collide', forceCollide);

    function init(jsonPath) {
        // Polling data from the json
        d3.queue()
            .defer(d3.json, jsonPath)
            .await(ready);
    }

    init('data/cantons.json');

    function ready(error, data) {
        if (error === true) {
            alert('An error has occured whil loading the data');
            return;
        }

        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Create and append the circles to the canevas
        var circles = svg.selectAll('circle')
            .data(data)
            .enter().append('circle')
            .attr('class', 'dayData')
            .attr('r' , function(d) {
                return radiusScale(d.smsCount);
            })
            .attr('fill', function(d) {
                return colors[d.canton];
            })
            .on('click', function(d) {
                console.log(d);
                // var canton = d.canton;
                // var smsCount = d.smsCount;
                // var date = d.
                // console.log(canton);
                // console.log(smsCount);
                // console.log(date);
                // console.log('yPos', hoursXCoordinates[d.hourRange]);
                // console.log('xPos', hoursYCoordinates[d.hourRange]);
            })
            .on("mouseover", function(d, index) {
                var offset = jqSvgElement.position().top;
                
                div.transition().duration(200).style("opacity", 1);
                div.html('Canton: ' + d.canton + '<br/>' + 'sms envoyés: ' + d.smsCount)
                    .style("left", (d.x + bodyDefaultMargin + radiusScale(d.smsCount)) + "px")
                    .style("top", (d.y) + offset  + "px");
               })
            .on("mouseout", function(d) {
                div.transition().duration(500).style("opacity", 0);
            });
            

        // Event handling on buttons
        d3.select('#allButton').on('click', function() {
            setElementsOpacity(layoutElements, 'hidden', 'full');
            layoutElements.full.css('visibility', 'visible');

            // Override the current x force with the one below
            simulation.force('x', forceXCombine)
            .force('y', forceYBase)
            .alphaTarget(nudge) // Give a bit of a nudge to force a move speed
            .restart() // restart the animation
        });

        d3.select('#daysButton').on('click', function() {
            setElementsOpacity(layoutElements, 'hidden', 'weekDays');
            layoutElements.weekDays.css('visibility', 'visible');

            // Override the current x force with the one below
            simulation.force('x', forceWeekdaysXSplit)
            .force('y', forceYBase)
            .alphaTarget(nudge) // Give a bit of a nudge to force a move speed
            .restart() // restart the animation
        });

        d3.select('#dayNightButton').on('click', function() {
            setElementsOpacity(layoutElements, 'hidden', 'dayHalves');
            layoutElements.dayHalves.css('visibility', 'visible');

            // Override the current x force with the one below
            simulation.force('x', forceDayNightXSplit)
            .force('y', forceYBase)
            .alphaTarget(nudge) // Give a bit of a nudge to force a move speed
            .restart() // restart the animation
        });

        d3.select('#hoursButton').on('click', function() {
            setElementsOpacity(layoutElements, 'hidden', 'hours');
            layoutElements.hours.css('visibility', 'visible');

            // Override the current x force with the one below
            simulation.force('x', forceHoursX)
            .force('y', forceHoursY)
            .alphaTarget(nudge) // Give a bit of a nudge to force a move speed
            .restart() // restart the animation
        });

        var queue = null;

        smsButton.on('click', function() {
            d3.queue()
                .defer(d3.json, 'data/cantons.json')
                .await(ready);
        });

        callsButton.on('click', function() {
            console.log('test');
            d3.queue()
                .defer(d3.json, 'data/calls.json')
                .await(ready);
        });

        downloadsButton.on('click', function() {
        });

        function dimCircles(exception) {
            circles.style('opacity', function(d) {
                if (d.canton === exception)
                    return 1;
                return 0.2;
            });
        }

        function disableActiveCanton() {
            $('.active').removeClass('active');
        }

        $('.canton').on('click', function() {
            var canton = $(this);
            disableActiveCanton();
            var elementCanton = $(this).data().canton.toLowerCase();
            dimCircles(elementCanton);

            canton.addClass('active');
        });

        $('#resetCanton').on('click', function() {
            disableActiveCanton();
            circles.style('opacity', function(d) {
                return 1;
            });
        });

        // Fill the simulation with the json data
        // Note that a node equals a circle

        // Ticks like a clock, hence the need to define the function to be call on the tick
        simulation.nodes(data)
            .on('tick', ticked); // Bind the ticked method to the tick event
        
        // Function to be called whenever the simulation ticks
        function ticked() {
            circles.attr('cx', function(d) {
                return d.x;
            })
            .attr('cy', function(d) {
                return d.y;
            })
        }
    }
});