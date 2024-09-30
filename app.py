from flask import Flask, render_template, request, jsonify
import numpy as np
from kmeans.kmeans import KMeans

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_data', methods=['POST'])
def generate_data():
    n_points = 100
    X = np.random.rand(n_points, 2)
    return jsonify({'data': X.tolist()})

@app.route('/run_kmeans', methods=['POST'])
def run_kmeans():
    data = request.json
    X = np.array(data['data'])
    n_clusters = data['n_clusters']
    initialization = data['initialization']
    
    kmeans = KMeans(n_clusters=n_clusters)
    history = kmeans.fit(X, initialization=initialization)
    
    return jsonify({'history': [
        {'centroids': centroids.tolist(), 'labels': labels}
        for centroids, labels in history
    ]})

if __name__ == '__main__':
    app.run(debug=True, port=3000)