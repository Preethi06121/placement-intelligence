from sklearn.cluster import KMeans
import numpy as np

def assign_cluster(resume, coding, cs, aptitude):

    data = np.array([[resume, coding, cs, aptitude]])

    # Dummy centroids for initial fit
    model = KMeans(n_clusters=3, random_state=42, n_init=10)

    # Fit on synthetic training distribution
    training_data = np.array([
        [80, 80, 80, 80],
        [60, 60, 60, 60],
        [30, 30, 30, 30],
        [90, 85, 88, 92],
        [50, 45, 55, 60],
        [20, 25, 30, 35]
    ])

    model.fit(training_data)

    cluster = model.predict(data)[0]

    return int(cluster)