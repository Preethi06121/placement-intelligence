import database
from clustering import assign_cluster
from cs_questions import get_random_questions
from flask import Flask, request, jsonify, render_template, redirect, session, url_for, send_from_directory
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app.config import Config
from app.errors import register_error_handlers
from app.extensions import login_manager, migrate
from app.logger import configure_logging
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


def create_app():
    flask_app = Flask(__name__)
    flask_app.config.from_object(Config)
    configure_logging(flask_app)

    db.init_app(flask_app)
    migrate.init_app(flask_app, db)

    login_manager.login_view = "spa_login"
    login_manager.init_app(flask_app)
    register_error_handlers(flask_app)

    return flask_app


app = create_app()


@login_manager.unauthorized_handler
def handle_unauthorized():
    if request.path.startswith("/api/"):
        return jsonify({"error": "Unauthorized"}), 401
    return redirect(url_for("spa_login"))

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
        "skills_found": analysis.get('skills_matched', []),
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
    return redirect('/app/login')

@app.route('/')
def home():
    return redirect('/app')


UI_DIR = os.path.join(app.root_path, 'static', 'ui')


@app.route('/app')
@app.route('/app/')
def spa_app():
    return redirect(url_for('spa_login'))


@app.route('/app/login')
def spa_login():
    return send_from_directory(UI_DIR, 'login.html')


@app.route('/app/signup')
def spa_signup():
    return send_from_directory(UI_DIR, 'signup.html')


@app.route('/app/dashboard')
def spa_dashboard_page():
    return send_from_directory(UI_DIR, 'dashboard.html')


@app.route('/app/resume')
def spa_resume_page():
    return send_from_directory(UI_DIR, 'resume.html')


@app.route('/app/cs-test')
def spa_cs_test_page():
    return send_from_directory(UI_DIR, 'cs-test.html')


@app.route('/app/aptitude')
def spa_aptitude_page():
    return send_from_directory(UI_DIR, 'aptitude.html')


@app.route('/app/coding')
def spa_coding_page():
    return send_from_directory(UI_DIR, 'coding.html')

@app.route('/full_analysis', methods=['POST'])
@login_required
def full_analysis():

    job_description = request.form.get('job_description') or ''

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


def _attempt_to_dict(attempt: Attempt):
    return {
        "id": attempt.id,
        "user_id": attempt.user_id,
        "resume_score": attempt.resume_score,
        "coding_score": attempt.coding_score,
        "cs_score": attempt.cs_score,
        "aptitude_score": attempt.aptitude_score,
        "overall_score": attempt.overall_score,
        "readiness_label": attempt.readiness_label,
        "cluster_label": attempt.cluster_label,
        "created_at": attempt.created_at.isoformat() if attempt.created_at else None,
    }


@app.route('/api/me', methods=['GET'])
def api_me():
    if current_user.is_authenticated:
        return jsonify({
            "authenticated": True,
            "user": {"id": current_user.id, "email": current_user.email}
        })
    return jsonify({"authenticated": False, "user": None})


@app.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    logout_user()
    return jsonify({"ok": True})


@app.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.get_json(silent=True) or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "User already exists"}), 409

    hashed_password = generate_password_hash(password)
    new_user = User(email=email, password=hashed_password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"ok": True})


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json(silent=True) or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    login_user(user)
    return jsonify({"ok": True, "user": {"id": user.id, "email": user.email}})


@app.route('/api/progress', methods=['GET'])
@login_required
def api_progress():
    return jsonify({
        "cs_score": session.get('cs_score'),
        "coding_score": session.get('coding_score'),
        "aptitude_score": session.get('aptitude_score'),
    })


@app.route('/api/cs_test', methods=['GET'])
@login_required
def api_get_cs_test():
    questions = get_random_questions()
    session['cs_questions'] = questions
    # Do not expose correct answers to the frontend.
    public_questions = [{"question": q["question"], "options": q["options"]} for q in questions]
    return jsonify({"questions": public_questions})


@app.route('/api/cs_test', methods=['POST'])
@login_required
def api_submit_cs_test():
    questions = session.get('cs_questions')
    if not questions:
        return jsonify({"error": "CS test not initialized"}), 400

    data = request.get_json(silent=True) or {}
    answers = data.get("answers")
    if not isinstance(answers, list) or len(answers) != len(questions):
        return jsonify({"error": "answers must be a list with one entry per question"}), 400

    score = 0
    detailed_results = []

    for i, q in enumerate(questions):
        selected = answers[i]
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
    return jsonify({"score": percentage_score, "results": detailed_results})


@app.route('/api/aptitude_test', methods=['GET'])
@login_required
def api_get_aptitude_test():
    if 'aptitude_questions' not in session:
        questions = get_random_aptitude_questions()
        session['aptitude_questions'] = questions
    else:
        questions = session['aptitude_questions']
    # Do not expose correct answers to the frontend.
    public_questions = [{"question": q["question"], "options": q["options"]} for q in questions]
    return jsonify({"questions": public_questions})


@app.route('/api/aptitude_test', methods=['POST'])
@login_required
def api_submit_aptitude_test():
    questions = session.get('aptitude_questions')
    if not questions:
        return jsonify({"error": "Aptitude test not initialized"}), 400

    data = request.get_json(silent=True) or {}
    answers = data.get("answers")
    if not isinstance(answers, list) or len(answers) != len(questions):
        return jsonify({"error": "answers must be a list with one entry per question"}), 400

    score = 0
    detailed_results = []

    for i, q in enumerate(questions):
        selected = answers[i]
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
    session.pop('aptitude_questions', None)

    return jsonify({"score": percentage_score, "results": detailed_results})


@app.route('/api/coding_analysis', methods=['POST'])
@login_required
def api_coding_analysis():
    data = request.get_json(silent=True) or {}
    profile_url = data.get('leetcode_url')
    if not profile_url:
        return jsonify({"error": "leetcode_url is required"}), 400

    username = profile_url.strip("/").split("/")[-1]
    stats = analyze_leetcode_profile(username, limit=150)
    if not stats:
        return jsonify({"error": "Invalid username or profile not found"}), 400

    score = calculate_advanced_coding_score(stats)
    feedback = generate_feedback(stats, score)
    session['coding_score'] = score

    return jsonify({
        "total_stats": stats["total_stats"],
        "topic_count": stats["topic_count"],
        "score": score,
        "feedback": feedback
    })


@app.route('/api/full_analysis', methods=['POST'])
@login_required
def api_full_analysis():
    job_description = request.form.get('job_description') or ''

    file = request.files.get('resume')
    if not file:
        return jsonify({"error": "resume file is required"}), 400

    coding_score = session.get('coding_score', 0)
    cs_score = session.get('cs_score', 0)
    aptitude_score = session.get('aptitude_score', 0)

    os.makedirs("uploads", exist_ok=True)
    filepath = os.path.join("uploads", file.filename)
    file.save(filepath)

    text = extract_text_from_pdf(filepath)
    analysis = analyze_resume(text, job_description)
    resume_score = float(analysis['resume_score'])

    overall_score = float(
        resume_score * 0.3 +
        float(coding_score) * 0.3 +
        float(cs_score) * 0.2 +
        float(aptitude_score) * 0.2
    )

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

    # Optional prediction (does not change readiness logic)
    placement_prediction = None
    try:
        placement_prediction = predict_placement(coding_score, resume_score, cs_score)
    except Exception:
        placement_prediction = None

    return jsonify({
        "ok": True,
        "attempt": _attempt_to_dict(new_attempt),
        "resume_analysis": analysis,
        "placement_prediction": placement_prediction,
    })


@app.route('/api/dashboard', methods=['GET'])
@login_required
def api_dashboard():
    attempts = Attempt.query.filter_by(user_id=current_user.id).order_by(Attempt.created_at.desc()).all()
    attempts_list = [_attempt_to_dict(a) for a in attempts]

    latest = attempts_list[0] if attempts_list else None
    return jsonify({
        "attempts": attempts_list,
        "latest": latest,
    })

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)
