from clustering import assign_cluster
from predictor import predict_placement

from app.repositories.attempt_repository import create_attempt


def attempt_to_dict(attempt):
    return {"id": attempt.id, "user_id": attempt.user_id, "resume_score": attempt.resume_score,
            "coding_score": attempt.coding_score, "cs_score": attempt.cs_score,
            "aptitude_score": attempt.aptitude_score, "overall_score": attempt.overall_score,
            "readiness_label": attempt.readiness_label, "cluster_label": attempt.cluster_label,
            "created_at": attempt.created_at.isoformat() if attempt.created_at else None}


def create_placement_attempt(user_id, resume_score, coding_score, cs_score, aptitude_score):
    scores = [float(resume_score), float(coding_score), float(cs_score), float(aptitude_score)]
    overall = scores[0] * .3 + scores[1] * .3 + scores[2] * .2 + scores[3] * .2
    cluster = assign_cluster(*scores)
    readiness = {0: "READY", 1: "ALMOST_READY"}.get(cluster, "NOT_READY")
    attempt = create_attempt(user_id=user_id, resume_score=scores[0], coding_score=scores[1],
                             cs_score=scores[2], aptitude_score=scores[3], overall_score=overall,
                             readiness_label=readiness, cluster_label=cluster)
    try:
        prediction = predict_placement(scores[1], scores[0], scores[2])
        prediction = prediction.item() if hasattr(prediction, "item") else prediction
    except Exception:
        prediction = None
    return attempt, prediction
