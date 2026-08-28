import os

from flask import Blueprint, redirect, render_template, request, send_from_directory, session, url_for
from flask_login import current_user, login_required, login_user, logout_user

from aptitude_questions import get_random_aptitude_questions
from cs_questions import get_random_questions
from leetcode_analyzer import analyze_leetcode_profile, calculate_advanced_coding_score, generate_feedback
from app.repositories.attempt_repository import get_attempts_by_user
from app.services.auth_service import authenticate_user, register_user
from app.services.assessment_service import grade_answers
from app.services.placement_service import create_placement_attempt
from app.services.resume_service import analyze_uploaded_resume
from app.utils.validation import validate_resume_file


web = Blueprint("web", __name__)
UI_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "ui")


@web.route("/")
def home():
    return redirect("/app")


@web.route("/app")
@web.route("/app/")
def spa_app():
    return redirect(url_for("web.spa_login"))


def spa_page(filename):
    return send_from_directory(UI_DIR, filename)


@web.route("/app/login")
def spa_login(): return spa_page("login.html")
@web.route("/app/signup")
def spa_signup(): return spa_page("signup.html")
@web.route("/app/dashboard")
def spa_dashboard_page(): return spa_page("dashboard.html")
@web.route("/app/resume")
def spa_resume_page(): return spa_page("resume.html")
@web.route("/app/cs-test")
def spa_cs_test_page(): return spa_page("cs-test.html")
@web.route("/app/aptitude")
def spa_aptitude_page(): return spa_page("aptitude.html")
@web.route("/app/coding")
def spa_coding_page(): return spa_page("coding.html")


@web.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        user = register_user(request.form.get("email", ""), request.form.get("password", ""))
        return redirect("/login") if user else ("User already exists", 409)
    return render_template("signup.html")


@web.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = authenticate_user(request.form.get("email"), request.form.get("password"))
        if user:
            login_user(user)
            return redirect("/dashboard")
        return "Invalid credentials", 401
    return render_template("login.html")


@web.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect("/app/login")


@web.route("/cs_test")
@login_required
def cs_test():
    questions = get_random_questions()
    session["cs_questions"] = questions
    return render_template("cs_test.html", questions=questions)


@web.route("/submit_cs_test", methods=["POST"])
@login_required
def submit_cs_test():
    questions = session.get("cs_questions")
    if not questions:
        return redirect("/cs_test")
    score, results = grade_answers(questions, [request.form.get(f"q{i}", "") for i in range(len(questions))])
    session["cs_score"] = score
    return render_template("cs_result.html", score=score, results=results)


@web.route("/aptitude_test")
@login_required
def aptitude_test():
    questions = get_random_aptitude_questions()
    session["aptitude_questions"] = questions
    return render_template("aptitude_test.html", questions=questions)


@web.route("/submit_aptitude_test", methods=["POST"])
@login_required
def submit_aptitude_test():
    questions = session.get("aptitude_questions")
    if not questions:
        return redirect("/aptitude_test")
    score, results = grade_answers(questions, [request.form.get(f"q{i}", "") for i in range(len(questions))])
    session["aptitude_score"] = score
    session.pop("aptitude_questions", None)
    return render_template("aptitude_result.html", score=score, results=results)


@web.route("/coding_analysis", methods=["GET", "POST"])
@login_required
def coding_analysis():
    if request.method == "POST":
        profile_url = request.form.get("leetcode_url", "")
        username = profile_url.strip().rstrip("/").split("/")[-1]
        stats = analyze_leetcode_profile(username, limit=150)
        if not stats:
            return "Invalid username or profile not found", 400
        score = calculate_advanced_coding_score(stats)
        session["coding_score"] = score
        return render_template("coding_result.html", total_stats=stats["total_stats"], topic_count=stats["topic_count"],
                               score=score, feedback=generate_feedback(stats, score))
    return render_template("coding_analysis.html")


@web.route("/full_analysis", methods=["POST"])
@login_required
def full_analysis():
    file = request.files.get("resume")
    if validate_resume_file(file):
        return "A PDF resume is required", 400
    analysis, _ = analyze_uploaded_resume(file, "uploads", request.form.get("job_description", ""))
    create_placement_attempt(current_user.id, analysis["resume_score"], session.get("coding_score", 0),
                             session.get("cs_score", 0), session.get("aptitude_score", 0))
    return redirect("/dashboard")


@web.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", attempts=get_attempts_by_user(current_user.id))
