from flask import current_app, jsonify, request
from werkzeug.exceptions import InternalServerError, RequestEntityTooLarge


def register_error_handlers(app):
    app.register_error_handler(404, handle_not_found)
    app.register_error_handler(403, handle_forbidden)
    app.register_error_handler(500, handle_internal_server_error)
    app.register_error_handler(RequestEntityTooLarge, handle_request_entity_too_large)


def handle_not_found(error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Endpoint not found"}), 404
    return error.get_response()


def handle_forbidden(error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Forbidden"}), 403
    return error.get_response()


def handle_request_entity_too_large(error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "File is too large. Maximum upload size is 5 MB."}), 413
    return error.get_response()


def handle_internal_server_error(error):
    original_error = getattr(error, "original_exception", None)

    if original_error is not None:
        current_app.logger.error(
            "Unhandled server error",
            exc_info=original_error,
        )
    else:
        current_app.logger.error("Unhandled server error")

    if request.path.startswith("/api/"):
        return jsonify({"error": "Internal server error"}), 500
    if isinstance(error, InternalServerError):
        return error.get_response()

    return InternalServerError().get_response()
