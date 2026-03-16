from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Attempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    resume_score = db.Column(db.Float)
    coding_score = db.Column(db.Float)
    cs_score = db.Column(db.Float)
    aptitude_score = db.Column(db.Float)
    overall_score = db.Column(db.Float)
    readiness_label = db.Column(db.String(50))
    cluster_label = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)