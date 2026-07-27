from flask import current_app
from werkzeug.exceptions import InternalServerError


def register_error_handlers(app):
    app.register_error_handler(404, handle_not_found)
    app.register_error_handler(403, handle_forbidden)
    app.register_error_handler(500, handle_internal_server_error)


def handle_not_found(error):
    return error.get_response()


def handle_forbidden(error):
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

    if isinstance(error, InternalServerError):
        return error.get_response()

    return InternalServerError().get_response()
