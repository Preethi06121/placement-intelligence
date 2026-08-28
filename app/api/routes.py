from flask import Blueprint, current_app, jsonify, request, session
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from sqlalchemy import text

from aptitude_questions import get_random_aptitude_questions
from cs_questions import get_random_questions
from leetcode_analyzer import (
    CodingPlatformUnavailable,
    analyze_leetcode_profile,
    calculate_advanced_coding_score,
    generate_feedback,
)
from app.extensions import db, limiter
from app.repositories.attempt_repository import get_attempts_by_user
from app.repositories.user_repository import get_user_by_id
from app.services.assessment_service import grade_answers, public_questions
from app.services.auth_service import authenticate_user, register_user
from app.services.placement_service import attempt_to_dict, create_placement_attempt
from app.services.resume_service import analyze_resume_text, analyze_uploaded_resume
from app.utils.validation import validate_credentials, validate_resume_file


api = Blueprint("api", __name__, url_prefix="/api")


def error(message, status=400):
    return jsonify({"error": message}), status


def coding_platform_unavailable():
    return jsonify({
        "success": False,
        "error": {
            "code": "CODING_PLATFORM_UNAVAILABLE",
            "message": "Unable to reach the coding platform right now. Please try again later.",
        },
    }), 502


def api_user_id():
    return int(get_jwt_identity())


def ensure_session_owner():
    """Clear short-lived browser state when a different JWT uses this browser."""
    user_id = str(api_user_id())
    if session.get("_jwt_user_id") != user_id:
        session.clear()
        session["_jwt_user_id"] = user_id


@api.get("/health")
def health():
    response = {"status": "ok"}
    try:
        db.session.execute(text("SELECT 1"))
        response["database"] = "ok"
    except Exception:
        current_app.logger.warning("Health check database query failed", exc_info=True)
        response["database"] = "unavailable"
    return jsonify(response)


@api.post("/signup")
@limiter.limit("5 per minute")
def signup():
    data = request.get_json(silent=True) or {}
    email, password = data.get("email"), data.get("password")
    validation_error = validate_credentials(email, password)
    if validation_error:
        return error(validation_error)
    user = register_user(email, password)
    if not user:
        return error("User already exists", 409)
    token = create_access_token(identity=str(user.id))
    return jsonify({"ok": True, "access_token": token, "user": {"id": user.id, "email": user.email}}), 201


@api.post("/login")
@limiter.limit("10 per minute")
def login():
    data = request.get_json(silent=True) or {}
    email, password = data.get("email"), data.get("password")
    if not email or not password:
        return error("email and password are required")
    user = authenticate_user(email, password)
    if not user:
        return error("Invalid credentials", 401)
    token = create_access_token(identity=str(user.id))
    return jsonify({"ok": True, "access_token": token, "user": {"id": user.id, "email": user.email}})


@api.post("/logout")
@jwt_required()
def logout():
    # JWTs are stateless: the client removes its token. Short expirations limit exposure.
    session.clear()
    return jsonify({"ok": True})


@api.get("/me")
@jwt_required()
def me():
    user = get_user_by_id(api_user_id())
    if not user:
        return error("User not found", 404)
    return jsonify({"authenticated": True, "user": {"id": user.id, "email": user.email}})


@api.get("/progress")
@jwt_required()
def progress():
    ensure_session_owner()
    return jsonify({"cs_score": session.get("cs_score"), "coding_score": session.get("coding_score"),
                    "aptitude_score": session.get("aptitude_score")})


def assessment_questions(session_key, generator):
    questions = generator()
    session[session_key] = questions
    return jsonify({"questions": public_questions(questions)})


def submit_assessment(question_key, score_key):
    questions = session.get(question_key)
    if not questions:
        return error("Assessment not initialized. Request questions first.")
    try:
        score, results = grade_answers(questions, (request.get_json(silent=True) or {}).get("answers"))
    except ValueError as exc:
        return error(str(exc))
    session[score_key] = score
    session.pop(question_key, None)
    return jsonify({"score": score, "results": results})


@api.get("/cs_test")
@jwt_required()
def get_cs_test():
    ensure_session_owner()
    return assessment_questions("cs_questions", get_random_questions)


@api.post("/cs_test")
@jwt_required()
def submit_cs_test():
    ensure_session_owner()
    return submit_assessment("cs_questions", "cs_score")


@api.get("/aptitude_test")
@jwt_required()
def get_aptitude_test():
    ensure_session_owner()
    return assessment_questions("aptitude_questions", get_random_aptitude_questions)


@api.post("/aptitude_test")
@jwt_required()
def submit_aptitude_test():
    ensure_session_owner()
    return submit_assessment("aptitude_questions", "aptitude_score")


@api.post("/resume/analyze")
@jwt_required()
def resume_analyze():
    data = request.get_json(silent=True) or {}
    resume_text = data.get("resume_text")
    if not isinstance(resume_text, str) or not resume_text.strip():
        return error("resume_text is required")
    return jsonify(analyze_resume_text(resume_text, data.get("job_description", "")))


@api.post("/resume/upload")
@jwt_required()
def resume_upload():
    file = request.files.get("resume")
    validation_error = validate_resume_file(file)
    if validation_error:
        return error(validation_error)
    try:
        analysis, _ = analyze_uploaded_resume(file, current_app.config.get("UPLOAD_FOLDER", "uploads"),
                                               request.form.get("job_description", ""))
    except (OSError, ValueError) as exc:
        return error(str(exc))
    except Exception:
        current_app.logger.exception("Resume upload analysis failed")
        return error("Unable to analyze resume", 422)
    return jsonify({"resume_score": analysis["resume_score"], "skills_found": analysis.get("skills_matched", []),
                    "analysis": analysis})


@api.post("/coding_analysis")
@jwt_required()
def coding_analysis():
    ensure_session_owner()
    profile_url = (request.get_json(silent=True) or {}).get("leetcode_url")
    if not isinstance(profile_url, str) or not profile_url.strip():
        return error("leetcode_url is required")
    username = profile_url.strip().rstrip("/").split("/")[-1]
    if not username.replace("-", "").replace("_", "").isalnum():
        return error("leetcode_url must contain a valid username")
    try:
        stats = analyze_leetcode_profile(username, limit=150)
    except CodingPlatformUnavailable:
        current_app.logger.exception("LeetCode analysis failed")
        return coding_platform_unavailable()
    if not stats:
        return error("Invalid username or profile not found")
    score = calculate_advanced_coding_score(stats)
    session["coding_score"] = score
    return jsonify({"total_stats": stats["total_stats"], "topic_count": stats["topic_count"], "score": score,
                    "feedback": generate_feedback(stats, score)})


@api.post("/full_analysis")
@jwt_required()
def full_analysis():
    ensure_session_owner()
    file = request.files.get("resume")
    validation_error = validate_resume_file(file)
    if validation_error:
        return error(validation_error)
    try:
        analysis, _ = analyze_uploaded_resume(file, current_app.config.get("UPLOAD_FOLDER", "uploads"),
                                               request.form.get("job_description", ""))
    except (OSError, ValueError) as exc:
        return error(str(exc))
    except Exception:
        current_app.logger.exception("Full resume analysis failed")
        return error("Unable to analyze resume", 422)
    attempt, prediction = create_placement_attempt(api_user_id(), analysis["resume_score"],
                                                    session.get("coding_score", 0), session.get("cs_score", 0),
                                                    session.get("aptitude_score", 0))
    return jsonify({"ok": True, "attempt": attempt_to_dict(attempt), "resume_analysis": analysis,
                    "placement_prediction": prediction})


@api.get("/dashboard")
@jwt_required()
def dashboard():
    attempts = [attempt_to_dict(attempt) for attempt in get_attempts_by_user(api_user_id())]
    return jsonify({"attempts": attempts, "latest": attempts[0] if attempts else None})
