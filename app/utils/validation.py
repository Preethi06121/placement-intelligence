import re

from werkzeug.utils import secure_filename


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def validate_credentials(email, password):
    if not isinstance(email, str) or not EMAIL_PATTERN.fullmatch(email.strip()):
        return "A valid email address is required."
    if not isinstance(password, str) or len(password) < 8:
        return "Password must contain at least 8 characters."
    return None


def validate_resume_file(file):
    if file is None or not file.filename:
        return "resume file is required"
    filename = secure_filename(file.filename)
    if not filename or "." not in filename or filename.rsplit(".", 1)[1].lower() != "pdf":
        return "resume must be a PDF file"
    return None
