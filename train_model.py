import pandas as pd
from sklearn.linear_model import LogisticRegression
import joblib

data = {
    "coding_score": [90,85,80,70,60,50,40,30],
    "resume_score": [85,80,75,65,55,45,35,25],
    "cs_score": [88,82,78,68,58,48,38,28],
    "label": ["READY","READY","READY","ALMOST_READY","ALMOST_READY","NOT_READY","NOT_READY","NOT_READY"]
}

df = pd.DataFrame(data)

X = df[["coding_score","resume_score","cs_score"]]
y = df["label"]

model = LogisticRegression()
model.fit(X,y)

joblib.dump(model,"placement_model.pkl")

print("Model trained and saved")
