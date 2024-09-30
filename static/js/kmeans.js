let data = [];
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
    console.log("Generating new data...");
    fetch('/generate_data', { method: 'POST' })
        .then(response => response.json())
        .then(result => {
            data = result.data;
            history = [];
            currentStep = 0;
            manualCentroids = [];
            console.log("New data generated:", data);
            updateVisualization();
        })
        .catch(error => console.error('Error generating data:', error));
}

function runKMeans() {
    console.log("Running KMeans...");
    const initMethod = document.getElementById("initialization-method").value;
    const numClusters = parseInt(document.getElementById("num-clusters").value, 10);
    if (initMethod === 'manual' && manualCentroids.length < numClusters) {
        alert(`Please select ${numClusters} centroids manually.`);
        return;
    }

    const requestData = {
        data: data,
        n_clusters: numClusters,
        initialization: initMethod,
        manual_centroids: initMethod === 'manual' ? manualCentroids : null
    };

    console.log("Request data:", requestData);

    fetch('/run_kmeans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(result => {
        console.log("KMeans result:", result);
        if (result.error) {
            throw new Error(result.error);
        }
        history = result.history;
        currentStep = 0;
        updateVisualization();
        document.getElementById("step").disabled = false;
        document.getElementById("converge").disabled = false;
    })
    .catch(error => {
        console.error('Error running KMeans:', error);
        alert('Error running KMeans: ' + error.message);
    });
}

function updateVisualization() {
    console.log("Updating visualization...");
    console.log("Current step:", currentStep);
    console.log("History length:", history.length);

    xScale.domain([0, 1]);
    yScale.domain([0, 1]);

    svg.selectAll("*").remove();

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Always draw the data points
    svg.selectAll(".data-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d[0]))
        .attr("cy", d => yScale(d[1]))
        .attr("r", 3)
        .attr("fill", "black");

    // Only draw centroids and color points if we have history
    if (history.length > 0 && history[currentStep]) {
        // Update data point colors
        svg.selectAll(".data-point")
            .attr("fill", (d, i) => d3.schemeCategory10[history[currentStep].labels[i]]);

        // Draw centroids
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

    console.log("Visualization updated.");

    // Check if the last step is reached and show an alert
    if (currentStep === history.length - 1) {
        alert("The KMeans algorithm has converged.");
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded and parsed");

    document.getElementById("generate-data").addEventListener("click", generateData);
    document.getElementById("run-kmeans").addEventListener("click", runKMeans);
    document.getElementById("step").addEventListener("click", () => {
        console.log("Step clicked");
        if (history.length > 0 && currentStep < history.length - 1) {
            currentStep++;
            updateVisualization();
        }
        if (currentStep === history.length - 1) {
            document.getElementById("step").disabled = true;
        }
    });
    document.getElementById("converge").addEventListener("click", () => {
        console.log("Converge clicked");
        if (history.length > 0) {
            currentStep = history.length - 1;
            updateVisualization();
            document.getElementById("step").disabled = true;
            document.getElementById("converge").disabled = true;
        }
    });
    document.getElementById("reset").addEventListener("click", () => {
        console.log("Reset clicked");
        history = [];
        currentStep = 0;
        manualCentroids = [];
        updateVisualization();
        document.getElementById("step").disabled = true;
        document.getElementById("converge").disabled = true;
    });
    document.getElementById("initialization-method").addEventListener("change", () => {
        console.log("Initialization method changed");
        if (document.getElementById("initialization-method").value === 'manual') {
            svg.on("click", event => {
                if (manualCentroids.length < parseInt(document.getElementById("num-clusters").value, 10)) {
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
});

console.log("JavaScript file loaded");
