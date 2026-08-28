from app.extensions import db
from app.models import User


def get_user_by_id(user_id):
    return db.session.get(User, int(user_id))


def get_user_by_email(email):
    return User.query.filter_by(email=email).first()


def create_user(email, password):
    user = User(email=email, password=password)
    db.session.add(user)
    db.session.commit()
    return user
