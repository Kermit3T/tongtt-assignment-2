import numpy as np
from typing import List, Tuple

class KMeans:
    def __init__(self, n_clusters: int, max_iterations: int = 100):
        self.n_clusters = n_clusters
        self.max_iterations = max_iterations
        self.centroids = None

    def fit(self, X: np.ndarray, initialization: str = 'random') -> List[Tuple[np.ndarray, List[int]]]:
        if initialization == 'random':
            self.centroids = self._initialize_random(X)
        elif initialization == 'farthest_first':
            self.centroids = self._initialize_farthest_first(X)
        elif initialization == 'kmeans++':
            self.centroids = self._initialize_kmeans_plus_plus(X)
        else:
            raise ValueError("Invalid initialization method")

        history = []
        for _ in range(self.max_iterations):
            labels = self._assign_clusters(X)
            history.append((self.centroids.copy(), labels))
            new_centroids = self._update_centroids(X, labels)
            if np.all(self.centroids == new_centroids):
                break
            self.centroids = new_centroids

        return history

    def _initialize_random(self, X: np.ndarray) -> np.ndarray:
        indices = np.random.choice(X.shape[0], self.n_clusters, replace=False)
        return X[indices]

    def _initialize_farthest_first(self, X: np.ndarray) -> np.ndarray:
        centroids = [X[np.random.choice(X.shape[0])]]
        for _ in range(1, self.n_clusters):
            distances = np.array([min([np.linalg.norm(x - c) for c in centroids]) for x in X])
            centroids.append(X[np.argmax(distances)])
        return np.array(centroids)

    def _initialize_kmeans_plus_plus(self, X: np.ndarray) -> np.ndarray:
        centroids = [X[np.random.choice(X.shape[0])]]
        for _ in range(1, self.n_clusters):
            distances = np.array([min([np.linalg.norm(x - c) for c in centroids]) for x in X])
            probabilities = distances ** 2 / np.sum(distances ** 2)
            cumulative_probabilities = np.cumsum(probabilities)
            r = np.random.rand()
            for j, p in enumerate(cumulative_probabilities):
                if r < p:
                    centroids.append(X[j])
                    break
        return np.array(centroids)

    def _assign_clusters(self, X: np.ndarray) -> List[int]:
        return [np.argmin([np.linalg.norm(x - c) for c in self.centroids]) for x in X]

    def _update_centroids(self, X: np.ndarray, labels: List[int]) -> np.ndarray:
        return np.array([X[np.array(labels) == k].mean(axis=0) for k in range(self.n_clusters)])

    def predict(self, X: np.ndarray) -> List[int]:
        return self._assign_clusters(X)