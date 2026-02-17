import joblib

model = joblib.load("placement_model.pkl")

def predict_placement(coding_score, resume_score, cs_score):

    prediction = model.predict([[coding_score, resume_score, cs_score]])

    return prediction[0]
