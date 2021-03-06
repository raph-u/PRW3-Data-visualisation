$(function() {
    // Canvas dimensions
    var width = $(window).width(), height = 500;

    // Maps canton identifiers and colors
    var colors = {
        'AG' : 'AntiqueWhite',
        'AI' : 'Aqua',
        'AR' : 'Aquamarine',
        'BE' : 'Blue',
        'BL' : 'BlueViolet',
        'BS' : 'Brown',
        'FR' : 'BurlyWood',
        'GE' : 'CadetBlue',
        'GL' : 'Chartreuse',
        'GR' : 'Coral',
        'JU' : 'CornflowerBlue',
        'LI' : 'SlateGrey',
        'LU' : 'Crimson',
        'NE' : 'Cyan',
        'NW' : 'Yellow',
        'OW' : 'DarkGoldenRod',
        'SG' : 'DarkMagenta',
        'SH' : 'DarkOrchid',
        'SO' : 'DarkSeaGreen',
        'SZ' : 'DarkSlateBlue',
        'TG' : 'Fuchsia',
        'TI' : 'Gold',
        'UR' : 'Green',
        'VD' : 'Lavender',
        'VS' : 'LightCoral',
        'ZG' : 'LightGoldenRodYellow',
        'ZH': 'Pink'
    };

    // Elements displaying info about data e.g. weekdays, time, etc.
    var layoutElements = {
        'full': $('#full'),
        'weekDays': $('.weekDay'),
        'dayHalves': $('.dayHalfPeriod'),
        'hours': $('.hourRange')
    };

    // Buttons
    var smsButton = $('#smsButton');
    var callsButton = $('#callsButton');
    var downloadsButton = $('#downloadsButton');
    var resetCantonFilterButton = $('#resetCantonFilterButton');

    var bodyDefaultMargin = parseInt($('body').css('margin'));

    // Maps weekdays and their position
    // Structure : {'Day' : <center coordinates>};
    var weekDaysXCoordinates = getXaxisCenters(layoutElements.weekDays);
    // var weekDaysYCoordinates = getYaxisCenters(layoutElements['weekDays'].first());

    var dayNightXCoordinates = getXaxisCenters(layoutElements.dayHalves);
    // var dayNightYCoordinates = getYaxisCenters(layoutElements['dayHalves'].first());

    var hoursXCoordinates = getXaxisCenters(layoutElements.hours);
    var hoursYCoordinates = getYaxisCenters(layoutElements.hours);

    // spacing between each circles
    var circleSpacing = 2;
    var nudge = 0.25;
    var baseForceStrength = 0.025;

    // Indicates whether all canton circles trigger mouseover events
    var allCirclesAreInteractive = true;

    // Holds the canton identifiers of circles that are allowed to trigger mousover events
    var interactiveCantons = [];

    // Returns the center position (x-axis) of the given divs
    function getXaxisCenters(elements) {
        var coordinates = {};

        elements.each(function() {
            var currentElement = $(this);
            var start = currentElement.position().left - bodyDefaultMargin;
            var width = this.offsetWidth;
            // var end = start + width;

            var key = currentElement.data().axiskey;

            coordinates[key] = start + (width / 2);
        });

        return coordinates;
    }

    function getYaxisCenters(elements) {
        var coordinates = {};

        elements.each(function() {
            var currentElement = this;
            var jq_currentElement = $(this);

            // Position relative to the parent container
            var offset = currentElement.offsetTop;

            var height = currentElement.offsetHeight;
            // var end = start + width;

            var key = jq_currentElement.data().axiskey;

            coordinates[key] = offset + (height / 2);
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

    // RANGES
    var downloadRange = {
        'min': 2,
        'max': 4558
    };
    var callsRange = {
        'min': 8,
        'max': 176414
    };
    var SMSRange = {
        'min': 15,
        'max': 47487
    };

    // The range specifies how big circles will be
    // In this case, the smallest will have a radius of 1, while the biggest will be 15
    var radiusScale = d3.scaleSqrt().domain([SMSRange.min, SMSRange.max]).range([1, 12]);

    // var forceY = d3.forceY(function(d) {
    //     return height / 2;
    // }).strength(baseForceStrength);

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
        return radiusScale(d.amount) + circleSpacing;
    }).strength(1);

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

        .force('center', d3.forceCenter(width / 2, height / 2))

        // .force('charge', d3.forceManyBody().strength(1))

        // Apply a force that prevents circles from overlapping on top of each other
        // the parameter specifies the radius of space
        // NO overlap occur for as long as the radius is the same as the circle's
        .force('collide', forceCollide);

        // var queue = null;

        smsButton.on('click', function() {
            // init('datasets/number_sms_per_canton_per_hour.json');
            // d3.queue()
            //     .defer(d3.json, 'datasets/cantons.json')
            //     .await(ready);
        });

        callsButton.on('click', function() {
            console.log('test');
            // init('datasets/number_calls_per_canton_per_hour.json');
            // d3.json('datasets/number_calls_per_canton_per_hour.json', function(error, data) {
            //     console.log(data);
            // });
        });

        downloadsButton.on('click', function() {
        });

    function init(jsonPath) {
        // Polling data from the json
        // d3.queue()
        //     .defer(d3.json, jsonPath)
        //     .await(ready);
        d3.json(jsonPath, function(error, data) {
            // console.log(data);
            ready(error, data);
        });
    }

    init('datasets/number_sms_per_canton_per_hour.json');

    function ready(error, data) {
        if (error === true) {
            alert('An error has occured while loading the data');
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
                return radiusScale(d.amount);
            })
            .attr('fill', function(d) {
                return colors[d.canton];
            })
            .on('click', function(d) {
                console.log(d);
                // var canton = d.canton;
                // var amount = d.amount;
                // var date = d.
                // console.log(canton);
                // console.log(amount);
                // console.log(date);
                // console.log('yPos', hoursXCoordinates[d.hourRange]);
                // console.log('xPos', hoursYCoordinates[d.hourRange]);
            })
            .on("mouseover", function(d, index) {
                // only display tooltips for the circles representing an interactive canton
                if (allCirclesAreInteractive === true ||
                    isCantonInteractive(d.canton.toLowerCase())) {
                        d3.select(this).attr('stroke-width', 2);
                        d3.select(this).attr('stroke', 'black');

                        var offset = jqSvgElement.position().top;

                        div.transition().duration(200).style("opacity", 1);
                        div.html('Canton: ' + d.canton + '<br/>' + 'sms envoyés: ' + d.amount + '<br/>' + 'Heure: ' + d.hour)
                            .style("left", (d.x + bodyDefaultMargin + radiusScale(d.amount)) + "px")
                            .style("top", (d.y) + offset  + "px");
                    }
           })
            .on("mouseout", function(d) {
                d3.select(this).attr('stroke', 'none');
                div.transition().duration(500).style("opacity", 0);
            });


        // Event handling on buttons
        d3.select('#allButton').on('click', function() {
            setElementsOpacity(layoutElements, 'hidden', 'full');
            layoutElements.full.css('visibility', 'visible');

            // Override the current x force with the one below
            simulation.force('x', forceXCombine)
            .force('y', forceYBase)
            .force('collide', forceCollide.strength(0.7))
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

        function dimCircles() {
            circles.transition().duration(200).style('opacity', function(d) {
                if (interactiveCantons.length > 0) {
                    if (isCantonInteractive(d.canton.toLowerCase()))
                        return 1;
                    return 0;
                }
                // The list is empty, all cantons are interactive and should be displayed
                return 1;
            });
        }

        function removeInteractiveCanton(cantonPrefix) {
            var indexToRemove = interactiveCantons.indexOf(cantonPrefix);
            interactiveCantons.splice(indexToRemove, 1);
        }

        function isCantonInteractive(cantonPrefix) {
            for (canton in interactiveCantons) {
                var currentCanton = interactiveCantons[canton];
                if (currentCanton === cantonPrefix) {
                    return true;
                }
            }
            return false;
        }

        function enableCantonFilterButton(isEnabled) {
            if (isEnabled) {
                resetCantonFilterButton.css('opacity', 1);
                resetCantonFilterButton.css('cursor', 'pointer');
            } else {
                resetCantonFilterButton.css('opacity', 0);
                resetCantonFilterButton.css('cursor', 'auto');
            }

            resetCantonFilterButton.prop("disabled", isEnabled);
        }

        function resetInteractiveCantons() {
            interactiveCantons = [];
            $('.active').removeClass('active');
            dimCircles();
            enableCantonFilterButton(false);
            allCirclesAreInteractive = true;
        }

        resetCantonFilterButton.on('click', function() {
            resetInteractiveCantons();
        });

        $('.canton').on('click', function() {
            var cantonPrefix = $(this).data().cantonprefix.toLowerCase();
            var clickedCanton = $(this);

            // Is a filter applied for this canton ?
            if (isCantonInteractive(cantonPrefix)) {
                removeInteractiveCanton(cantonPrefix);
                clickedCanton.removeClass('active');

                if (interactiveCantons.length === 0) {
                    allCirclesAreInteractive = true;
                    resetInteractiveCantons();
                    enableCantonFilterButton(false);
                }
            } else {
                interactiveCantons.push(cantonPrefix);
                clickedCanton.addClass('active');

                allCirclesAreInteractive = false;

                enableCantonFilterButton(true);
            }

            dimCircles();

            // console.log('inlist?', isCantonInteractive(cantonPrefix));
            // console.log(interactiveCantons);
            // console.log('allCirclesAreInteractive', allCirclesAreInteractive);

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