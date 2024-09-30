let data = [];
let centroids = [];
let labels = [];
let history = [];
let currentStep = 0;
let manualCentroids = [];

const width = 600;
const height = 400;
const margin = { top: 20, right: 20, bottom: 20, left: 40 };

const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

function generateData() {
    fetch('/generate_data', { method: 'POST' })
        .then(response => response.json())
        .then(result => {
            data = result.data;
            updateVisualization();
        });
}

function runKMeans() {
    const initMethod = document.getElementById("initialization-method").value;
    if (initMethod === 'manual' && manualCentroids.length < 3) {
        alert("Please select at least 3 centroids manually.");
        return;
    }

    const requestData = {
        data: data,
        n_clusters: 3,
        initialization: initMethod === 'manual' ? 'random' : initMethod
    };

    fetch('/run_kmeans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(result => {
        history = result.history;
        currentStep = 0;
        if (initMethod === 'manual') {
            history[0].centroids = manualCentroids;
        }
        updateVisualization();
    });
}

function updateVisualization() {
    xScale.domain([0, 1]);
    yScale.domain([0, 1]);

    svg.selectAll("*").remove();

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    svg.selectAll(".data-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d[0]))
        .attr("cy", d => yScale(d[1]))
        .attr("r", 3)
        .attr("fill", (d, i) => history.length > 0 ? d3.schemeCategory10[history[currentStep].labels[i]] : "black");

    if (history.length > 0) {
        svg.selectAll(".centroid")
            .data(history[currentStep].centroids)
            .enter()
            .append("circle")
            .attr("class", "centroid")
            .attr("cx", d => xScale(d[0]))
            .attr("cy", d => yScale(d[1]))
            .attr("r", 5)
            .attr("fill", (d, i) => d3.schemeCategory10[i])
            .attr("stroke", "black");
    }
}

document.getElementById("generate-data").addEventListener("click", generateData);
document.getElementById("step").addEventListener("click", () => {
    if (currentStep < history.length - 1) {
        currentStep++;
        updateVisualization();
    }
});
document.getElementById("converge").addEventListener("click", () => {
    currentStep = history.length - 1;
    updateVisualization();
});
document.getElementById("reset").addEventListener("click", () => {
    history = [];
    currentStep = 0;
    manualCentroids = [];
    updateVisualization();
});
document.getElementById("initialization-method").addEventListener("change", () => {
    if (document.getElementById("initialization-method").value === 'manual') {
        svg.on("click", event => {
            if (manualCentroids.length < 3) {
                const coords = d3.pointer(event);
                manualCentroids.push([xScale.invert(coords[0]), yScale.invert(coords[1])]);
                updateVisualization();
            }
        });
    } else {
        svg.on("click", null);
    }
});

generateData();