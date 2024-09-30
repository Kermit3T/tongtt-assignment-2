from flask import Flask, render_template, request, jsonify
import numpy as np
from kmeans.kmeans import KMeans
import traceback

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
    try:
        data = request.json
        X = np.array(data['data'])
        n_clusters = data['n_clusters']
        initialization = data['initialization']
        manual_centroids = data.get('manual_centroids')
        
        print(f"Received data: shape={X.shape}, n_clusters={n_clusters}, initialization={initialization}")
        
        kmeans = KMeans(n_clusters=n_clusters)
        history = kmeans.fit(X, initialization=initialization, manual_centroids=manual_centroids)
        
        print(f"KMeans completed. History length: {len(history)}")
        
        return jsonify({'history': [
            {'centroids': np.array(centroids).tolist(), 'labels': np.array(labels).tolist()}
            for centroids, labels in history
        ]})
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=3000)