import logging


LOG_FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
DEFAULT_LOG_LEVEL = logging.INFO


def configure_logging(app=None):
    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
    root_logger = logging.getLogger()

    if not root_logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)
    else:
        for handler in root_logger.handlers:
            handler.setFormatter(formatter)

    root_logger.setLevel(DEFAULT_LOG_LEVEL)

    if app is not None:
        app.logger.setLevel(DEFAULT_LOG_LEVEL)
        for handler in app.logger.handlers:
            handler.setFormatter(formatter)

    return root_logger
