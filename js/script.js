const margin = { top: 30, right: 30, bottom: 60, left: 75 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

let allData = [];
let selectedState = 'MD';
let selectedMetric = 'TAVG';
let selectedMonth = 'all';
let fullDateExtent = [];

const metricInfo = {
    TAVG: { label: 'Average Temperature', unit: '°F' },
    TMAX: { label: 'Maximum Temperature', unit: '°F' },
    TMIN: { label: 'Minimum Temperature', unit: '°F' },
    PRCP: { label: 'Average Reported Precipitation', unit: ' inches' },
    SNOW: { label: 'Average Reported Snowfall', unit: ' inches' },
    AWND: { label: 'Average Wind Speed', unit: ' mph' }
};

const stateNames = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    GU: 'Guam', MP: 'Northern Mariana Islands', PR: 'Puerto Rico', VI: 'U.S. Virgin Islands'
};

const parseDate = d3.timeParse('%Y%m%d');
const formatDate = d3.timeFormat('%B %d, %Y');

const svg = d3.select('#vis')
    .append('svg')
    .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleTime().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

const xAxisGroup = svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`);

const yAxisGroup = svg.append('g')
    .attr('class', 'axis');

const gridGroup = svg.append('g')
    .attr('class', 'grid')
    .lower();

const xLabel = svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', height + 48)
    .attr('text-anchor', 'middle')
    .text('Date');

const yLabel = svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -55)
    .attr('text-anchor', 'middle');

const noDataText = svg.append('text')
    .attr('x', width / 2)
    .attr('y', height / 2)
    .attr('text-anchor', 'middle')
    .style('display', 'none');

function setupDropdowns() {
    const states = Array.from(new Set(allData.map(d => d.state))).sort((a, b) => {
        return (stateNames[a] || a).localeCompare(stateNames[b] || b);
    });

    d3.select('#state-select')
        .selectAll('option')
        .data(states)
        .join('option')
        .attr('value', d => d)
        .text(d => `${stateNames[d] || d} (${d})`);

    d3.select('#metric-select')
        .selectAll('option')
        .data(Object.keys(metricInfo))
        .join('option')
        .attr('value', d => d)
        .text(d => metricInfo[d].label);

    const months = [
        { value: 'all', label: 'All Months' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' }
    ];

    d3.select('#month-select')
        .selectAll('option')
        .data(months)
        .join('option')
        .attr('value', d => d.value)
        .text(d => d.label);

    if (!states.includes(selectedState)) {
        selectedState = states[0];
    }

    d3.select('#state-select')
        .property('value', selectedState)
        .on('change', function () {
            selectedState = this.value;
            updateVis();
        });

    d3.select('#metric-select')
        .property('value', selectedMetric)
        .on('change', function () {
            selectedMetric = this.value;
            updateVis();
        });

    d3.select('#month-select')
        .property('value', selectedMonth)
        .on('change', function () {
            selectedMonth = this.value;
            updateVis();
        });
}

function updateVis() {
    const stateData = allData.filter(d => {
        const correctState = d.state === selectedState;
        const correctMonth = selectedMonth === 'all' || d.date.getMonth() + 1 === +selectedMonth;
        return correctState && correctMonth;
    });

    const currentData = stateData.filter(d => d[selectedMetric] !== null);

    const stateLabel = stateNames[selectedState] || selectedState;
    const monthLabel = selectedMonth === 'all'
        ? ''
        : ` during ${d3.timeFormat('%B')(new Date(2017, +selectedMonth - 1, 1))}`;

    if (currentData.length === 0) {
        svg.selectAll('.weather-line, .weather-point, .extreme-point, .extreme-label').remove();
        xAxisGroup.selectAll('*').remove();
        yAxisGroup.selectAll('*').remove();
        gridGroup.selectAll('*').remove();
        noDataText
            .style('display', null)
            .text('No data is available for this selection.');
        d3.select('#chart-title')
            .text(`Daily ${metricInfo[selectedMetric].label} in ${stateLabel}${monthLabel}`);
        yLabel.text(`${metricInfo[selectedMetric].label} (${metricInfo[selectedMetric].unit.trim()})`);
        d3.selectAll('#average-value, #highest-value, #lowest-value').text('No data');
        return;
    }

    noDataText.style('display', 'none');

    let xDomain = d3.extent(stateData, d => d.date);

    if (selectedMonth === 'all') {
        xDomain = fullDateExtent;
    }

    xScale.domain(xDomain);

    const rowsByDate = new Map(stateData.map(d => [+d.date, d]));
    const lineData = d3.timeDay
        .range(xDomain[0], d3.timeDay.offset(xDomain[1], 1))
        .map(date => rowsByDate.get(+date) || { date: date, [selectedMetric]: null });

    const valueExtent = d3.extent(currentData, d => d[selectedMetric]);
    const nonnegativeMetrics = ['PRCP', 'SNOW', 'AWND'];

    if (nonnegativeMetrics.includes(selectedMetric)) {
        yScale.domain([0, valueExtent[1] * 1.1 || 1]).nice();
    } else {
        const padding = (valueExtent[1] - valueExtent[0]) * 0.1 || 1;
        yScale.domain([valueExtent[0] - padding, valueExtent[1] + padding]).nice();
    }

    xAxisGroup
        .transition()
        .duration(500)
        .call(d3.axisBottom(xScale).ticks(8));

    yAxisGroup
        .transition()
        .duration(500)
        .call(d3.axisLeft(yScale).ticks(7));

    gridGroup
        .transition()
        .duration(500)
        .call(d3.axisLeft(yScale).ticks(7).tickSize(-width).tickFormat(''));

    const line = d3.line()
        .defined(d => d[selectedMetric] !== null)
        .x(d => xScale(d.date))
        .y(d => yScale(d[selectedMetric]));

    svg.selectAll('.weather-line')
        .data([lineData])
        .join('path')
        .attr('class', 'weather-line')
        .transition()
        .duration(500)
        .attr('d', line);

    const points = svg.selectAll('.weather-point')
        .data(currentData, d => d.date);

    points.exit().remove();

    points.enter()
        .append('circle')
        .attr('class', 'weather-point')
        .attr('r', 3)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d[selectedMetric]))
        .merge(points)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('r', 6);

            d3.select('#tooltip')
                .style('display', 'block')
                .html(
                    `<strong>${formatDate(d.date)}</strong><br>` +
                    `${metricInfo[selectedMetric].label}: ` +
                    `${d[selectedMetric].toFixed(2)}${metricInfo[selectedMetric].unit}`
                );
        })
        .on('mousemove', function (event) {
            d3.select('#tooltip')
                .style('left', `${event.pageX + 15}px`)
                .style('top', `${event.pageY - 35}px`);
        })
        .on('mouseout', function () {
            d3.select(this).attr('r', 3);
            d3.select('#tooltip').style('display', 'none');
        })
        .transition()
        .duration(500)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d[selectedMetric]));

    const highest = d3.greatest(currentData, d => d[selectedMetric]);
    const lowest = d3.least(currentData, d => d[selectedMetric]);
    const extremes = highest === lowest
        ? [{ ...highest, type: 'Highest' }]
        : [{ ...highest, type: 'Highest' }, { ...lowest, type: 'Lowest' }];

    svg.selectAll('.extreme-point')
        .data(extremes, d => d.type)
        .join('circle')
        .attr('class', 'extreme-point')
        .attr('r', 6)
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d[selectedMetric]))
        .attr('fill', d => d.type === 'Highest' ? '#d95f02' : '#245b78');

    svg.selectAll('.extreme-label')
        .data(extremes, d => d.type)
        .join('text')
        .attr('class', 'extreme-label')
        .attr('x', d => xScale(d.date))
        .attr('y', d => yScale(d[selectedMetric]) + (d.type === 'Highest' ? -10 : 20))
        .attr('text-anchor', d => xScale(d.date) > width - 80 ? 'end' : 'start')
        .attr('dx', d => xScale(d.date) > width - 80 ? -8 : 8)
        .attr('fill', d => d.type === 'Highest' ? '#d95f02' : '#245b78')
        .text(d => d.type);

    const average = d3.mean(currentData, d => d[selectedMetric]);
    const unit = metricInfo[selectedMetric].unit;
    d3.select('#average-value').text(`${average.toFixed(2)}${unit}`);
    d3.select('#highest-value').text(
        `${highest[selectedMetric].toFixed(2)}${unit} on ${formatDate(highest.date)}`
    );
    d3.select('#lowest-value').text(
        `${lowest[selectedMetric].toFixed(2)}${unit} on ${formatDate(lowest.date)}`
    );

    d3.select('#chart-title')
        .text(`Daily ${metricInfo[selectedMetric].label} in ${stateLabel}${monthLabel}`);

    yLabel.text(`${metricInfo[selectedMetric].label} (${metricInfo[selectedMetric].unit.trim()})`);
}

function init() {
    d3.csv('data/weather_state_daily.csv', d => ({
        state: d.state,
        date: parseDate(d.date),
        TAVG: d.TAVG === '' ? null : +d.TAVG,
        TMAX: d.TMAX === '' ? null : +d.TMAX,
        TMIN: d.TMIN === '' ? null : +d.TMIN,
        PRCP: d.PRCP === '' ? null : +d.PRCP,
        SNOW: d.SNOW === '' ? null : +d.SNOW,
        AWND: d.AWND === '' ? null : +d.AWND
    }))
    .then(data => {
        allData = data;
        fullDateExtent = d3.extent(allData, d => d.date);
        setupDropdowns();
        updateVis();
    })
    .catch(error => {
        console.error('Error loading weather data:', error);
        d3.select('#vis').text('The weather data could not be loaded.');
    });
}

window.addEventListener('load', init);

