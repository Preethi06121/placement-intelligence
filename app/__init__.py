from flask import Flask, jsonify, redirect, request, url_for

from app.api import api
from app.config import Config
from app.errors import register_error_handlers
from app.extensions import db, jwt, limiter, login_manager, migrate
from app.logger import configure_logging
from app.repositories.user_repository import get_user_by_id
from app.web import web


def create_app(config_override=None):
    app = Flask(__name__, static_folder="../static", template_folder="../templates")
    app.config.from_object(Config)
    if config_override:
        app.config.update(config_override)
    missing_secrets = [key for key in ("SECRET_KEY", "JWT_SECRET_KEY") if not app.config.get(key)]
    if missing_secrets:
        raise RuntimeError("Missing required environment variables: " + ", ".join(missing_secrets))
    configure_logging(app)
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    migrate.init_app(app, db)
    login_manager.login_view = "web.spa_login"
    login_manager.init_app(app)
    register_error_handlers(app)
    app.register_blueprint(api)
    app.register_blueprint(web)

    @login_manager.user_loader
    def load_user(user_id):
        return get_user_by_id(user_id)

    @login_manager.unauthorized_handler
    def handle_unauthorized():
        if request.path.startswith("/api/"):
            return jsonify({"error": "Unauthorized"}), 401
        return redirect(url_for("web.spa_login"))

    @jwt.unauthorized_loader
    def missing_jwt(reason):
        return jsonify({"error": "Authentication token is required"}), 401

    @jwt.invalid_token_loader
    def invalid_jwt(reason):
        return jsonify({"error": "Invalid authentication token"}), 401

    @jwt.expired_token_loader
    def expired_jwt(jwt_header, jwt_payload):
        return jsonify({"error": "Authentication token has expired"}), 401
    return app
