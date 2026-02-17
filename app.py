from pdf_parser import extract_text_from_pdf
import os
from resume_analyzer import analyze_resume
from predictor import predict_placement
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:g7hkSRyZ@localhost:5432/placement_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    coding_score = db.Column(db.Float)
    resume_score = db.Column(db.Float)
    cs_score = db.Column(db.Float)

@app.route('/')
def home():
    return "Placement Intelligence API Running"

@app.route('/student', methods=['POST'])
def add_student():
    data = request.json
    student = Student(
        name=data['name'],
        coding_score=data['coding_score'],
        resume_score=data['resume_score'],
        cs_score=data['cs_score']
    )
    db.session.add(student)
    db.session.commit()
    return jsonify({"message": "Student added successfully"})

@app.route('/readiness/<int:id>', methods=['GET'])
def readiness(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({"error": "Student not found"})
    
    score = (
        student.coding_score * 0.4 +
        student.resume_score * 0.3 +
        student.cs_score * 0.3
    )

    return jsonify({"readiness_score": round(score, 2)})

@app.route('/analyze_resume', methods=['POST'])
def analyze_resume_api():
    data = request.json
    
    resume_text = data['resume_text']
    
    result = analyze_resume(resume_text)
    
    return jsonify(result)

@app.route('/student/analyze_and_store', methods=['POST'])
def analyze_and_store():
    
    data = request.json
    
    name = data['name']
    coding_score = data['coding_score']
    cs_score = data['cs_score']
    resume_text = data['resume_text']
    
    analysis = analyze_resume(resume_text)
    
    resume_score = analysis['resume_score']
    
    student = Student(
        name=name,
        coding_score=coding_score,
        resume_score=resume_score,
        cs_score=cs_score
    )
    
    db.session.add(student)
    db.session.commit()
    
    return jsonify({
        "message": "Student stored with analyzed resume",
        "resume_score": resume_score,
        "skills_found": analysis['skills_found']
    })

@app.route('/upload_resume', methods=['POST'])
def upload_resume():
    
    file = request.files['resume']
    
    filepath = os.path.join("uploads", file.filename)
    
    file.save(filepath)
    
    text = extract_text_from_pdf(filepath)
    
    analysis = analyze_resume(text)
    
    return jsonify({
        "resume_score": analysis['resume_score'],
        "skills_found": analysis['skills_found']
    })

@app.route('/predict_placement', methods=['POST'])
def predict():

    data = request.json

    coding_score = data['coding_score']
    resume_score = data['resume_score']
    cs_score = data['cs_score']

    result = predict_placement(coding_score, resume_score, cs_score)

    return jsonify({
        "placement_prediction": result
    })

@app.route('/full_analysis', methods=['POST'])
def full_analysis():

    name = request.form['name']
    coding_score = float(request.form['coding_score'])
    cs_score = float(request.form['cs_score'])

    file = request.files['resume']

    filepath = os.path.join("uploads", file.filename)
    file.save(filepath)

    text = extract_text_from_pdf(filepath)

    analysis = analyze_resume(text)

    resume_score = analysis['resume_score']

    prediction = predict_placement(coding_score, resume_score, cs_score)

    student = Student(
        name=name,
        coding_score=coding_score,
        resume_score=resume_score,
        cs_score=cs_score
    )

    db.session.add(student)
    db.session.commit()

    return jsonify({
        "message": "Full analysis complete",
        "name": name,
        "resume_score": resume_score,
        "skills_found": analysis['skills_found'],
        "placement_prediction": prediction
    })



if __name__ == '__main__':
    with app.app_context():
        db.create_all()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)


