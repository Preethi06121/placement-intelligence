import os
from uuid import uuid4

from werkzeug.utils import secure_filename

from pdf_parser import extract_text_from_pdf
from resume_analyzer import analyze_resume


def analyze_resume_text(resume_text, job_description=""):
    return analyze_resume(resume_text, job_description)


def analyze_uploaded_resume(file, upload_folder, job_description=""):
    os.makedirs(upload_folder, exist_ok=True)
    path = os.path.join(upload_folder, f"{uuid4().hex}_{secure_filename(file.filename)}")
    file.save(path)
    try:
        text = extract_text_from_pdf(path)
        if not text or not text.strip():
            raise ValueError("The PDF does not contain readable text.")
        return analyze_resume(text, job_description), text
    finally:
        if os.path.exists(path):
            os.remove(path)
