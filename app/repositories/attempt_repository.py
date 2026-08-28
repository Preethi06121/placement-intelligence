from app.extensions import db
from app.models import Attempt


def create_attempt(
    user_id,
    resume_score,
    coding_score,
    cs_score,
    aptitude_score,
    overall_score,
    readiness_label,
    cluster_label,
):
    attempt = Attempt(
        user_id=user_id,
        resume_score=resume_score,
        coding_score=float(coding_score),
        cs_score=float(cs_score),
        aptitude_score=float(aptitude_score),
        overall_score=overall_score,
        readiness_label=readiness_label,
        cluster_label=str(cluster_label),
    )
    db.session.add(attempt)
    db.session.commit()
    return attempt


def get_attempts_by_user(user_id):
    return (
        Attempt.query.filter_by(user_id=user_id)
        .order_by(Attempt.created_at.desc())
        .all()
    )
