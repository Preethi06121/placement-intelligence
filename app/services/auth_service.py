from werkzeug.security import check_password_hash, generate_password_hash

from app.repositories.user_repository import create_user, get_user_by_email


def register_user(email, password):
    email = email.strip().lower()
    if get_user_by_email(email):
        return None
    return create_user(email, generate_password_hash(password))


def authenticate_user(email, password):
    if not isinstance(email, str) or not isinstance(password, str):
        return None
    user = get_user_by_email(email.strip().lower())
    return user if user and check_password_hash(user.password, password) else None
