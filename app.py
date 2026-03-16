import database
from clustering import assign_cluster
from cs_questions import get_random_questions
from flask import Flask, request, jsonify, render_template, redirect ,session
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from database import db, User, Attempt

from aptitude_questions import get_random_aptitude_questions

from leetcode_analyzer import (
    analyze_leetcode_profile,
    calculate_advanced_coding_score,
    generate_feedback
)

from pdf_parser import extract_text_from_pdf
from resume_analyzer import analyze_resume
from predictor import predict_placement
import os

app = Flask(__name__)

app.config['SECRET_KEY'] = 'super_secret_key_here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:g7hkSRyZ@localhost:5432/placement_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = "login"
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.route('/analyze_resume', methods=['POST'])
def analyze_resume_api():
    data = request.json
    
    resume_text = data['resume_text']
    
    result = analyze_resume(resume_text)
    
    return jsonify(result)


@app.route('/upload_resume', methods=['POST'])
def upload_resume():
    
    file = request.files['resume']
    
    filepath = os.path.join("uploads", file.filename)
    os.makedirs("uploads", exist_ok=True)
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

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return "User already exists"

        hashed_password = generate_password_hash(password)
        new_user = User(email=email, password=hashed_password)

        db.session.add(new_user)
        db.session.commit()

        return redirect('/login')

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect('/dashboard')

        return "Invalid credentials"

    return render_template('login.html')

@app.route('/cs_test')
@login_required
def cs_test():
    questions = get_random_questions()
    session['cs_questions'] = questions
    return render_template('cs_test.html', questions=questions)

@app.route('/submit_cs_test', methods=['POST'])
@login_required
def submit_cs_test():

    questions = session.get('cs_questions')

    if not questions:
        return redirect('/cs_test')

    score = 0
    detailed_results = []

    for i, q in enumerate(questions):
        selected = request.form.get(f"q{i}")
        correct_answer = q["answer"]

        is_correct = selected == correct_answer

        if is_correct:
            score += 1

        detailed_results.append({
            "question": q["question"],
            "selected": selected,
            "correct": correct_answer,
            "is_correct": is_correct
        })

    percentage_score = (score / len(questions)) * 100
    session['cs_score'] = percentage_score

    return render_template(
        'cs_result.html',
        score=percentage_score,
        results=detailed_results
    )

@app.route('/aptitude_test')
@login_required
def aptitude_test():

    if 'aptitude_questions' not in session:
        questions = get_random_aptitude_questions()
        session['aptitude_questions'] = questions
    else:
        questions = session['aptitude_questions']

    return render_template('aptitude_test.html', questions=questions)

@app.route('/submit_aptitude_test', methods=['POST'])
@login_required
def submit_aptitude_test():

    questions = session.get('aptitude_questions')

    if not questions:
        return redirect('/aptitude_test')

    score = 0
    detailed_results = []

    for i, q in enumerate(questions):
        selected = request.form.get(f"q{i}")
        correct_answer = q["answer"]

        is_correct = selected == correct_answer

        if is_correct:
            score += 1

        detailed_results.append({
            "question": q["question"],
            "selected": selected,
            "correct": correct_answer,
            "is_correct": is_correct
        })

    percentage_score = (score / len(questions)) * 100
    session['aptitude_score'] = percentage_score
    print("SESSION QUESTIONS DURING SUBMIT:", questions)
    session.pop('aptitude_questions', None)

    return render_template(
    'aptitude_result.html',
    score=percentage_score,
    results=detailed_results
)

@app.route('/coding_analysis', methods=['GET', 'POST'])
@login_required
def coding_analysis():

    if request.method == 'POST':
        profile_url = request.form['leetcode_url']
        username = profile_url.strip("/").split("/")[-1]

        stats = analyze_leetcode_profile(username, limit=150)

        if not stats:
            return "Invalid username or profile not found"

        score = calculate_advanced_coding_score(stats)

        # 🔥 THIS WAS MISSING
        feedback = generate_feedback(stats, score)

        session['coding_score'] = score

        return render_template(
            'coding_result.html',
            total_stats=stats["total_stats"],
            topic_count=stats["topic_count"],
            score=score,
            feedback=feedback   # 🔥 VERY IMPORTANT
        )

    return render_template('coding_analysis.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/login')

@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect('/dashboard')
    return redirect('/login')

@app.route('/full_analysis', methods=['POST'])
@login_required
def full_analysis():

    job_description = request.form['job_description']

    coding_score = session.get('coding_score', 0)
    cs_score = session.get('cs_score', 0)
    aptitude_score = session.get('aptitude_score', 0)

    file = request.files['resume']

    os.makedirs("uploads", exist_ok=True)
    filepath = os.path.join("uploads", file.filename)
    file.save(filepath)

    text = extract_text_from_pdf(filepath)

    analysis = analyze_resume(text, job_description)
    resume_score = float(analysis['resume_score'])

    # Weighted overall score
    overall_score = float(
        resume_score * 0.3 +
        coding_score * 0.3 +
        cs_score * 0.2 +
        aptitude_score * 0.2
    )

    # ---- CLUSTERING ----
    cluster_label = assign_cluster(
        resume_score,
        coding_score,
        cs_score,
        aptitude_score
    )

    if cluster_label == 0:
        readiness = "READY"
    elif cluster_label == 1:
        readiness = "ALMOST_READY"
    else:
        readiness = "NOT_READY"

    # ---- Weakest Area Detection ----
    areas = {
        "Resume": resume_score,
        "Coding": coding_score,
        "CS": cs_score,
        "Aptitude": aptitude_score
    }

    weakest_area = min(areas, key=areas.get)

    # ---- CREATE ATTEMPT OBJECT ----
    new_attempt = Attempt(
        user_id=current_user.id,
        resume_score=resume_score,
        coding_score=float(coding_score),
        cs_score=float(cs_score),
        aptitude_score=float(aptitude_score),
        overall_score=overall_score,
        readiness_label=readiness,
        cluster_label=str(cluster_label)
    )

    db.session.add(new_attempt)
    db.session.commit()

    return redirect('/dashboard')

@app.route('/dashboard')
@login_required
def dashboard():
    attempts = Attempt.query.filter_by(user_id=current_user.id).order_by(Attempt.created_at.desc()).all()
    return render_template('dashboard.html', attempts=attempts)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)