from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


COMMON_SKILLS = [
    "python","java","c++","javascript",
    "react","node","flask","django",
    "machine learning","deep learning",
    "tensorflow","pytorch","nlp",
    "computer vision",
    "sql","mysql","postgresql","mongodb",
    "aws","docker","kubernetes",
    "data structures","algorithms",
    "rest api","microservices",
    "html","css","typescript"
]


_DEFAULT_JD = (
    "software engineer developer internship placement full time "
    "python java algorithms data structures sql web machine learning "
    "backend frontend cs computer science"
)


def analyze_resume(resume_text, job_description=None):

    resume_text = resume_text.lower()
    job_description = (job_description or "").strip().lower()
    if not job_description:
        job_description = _DEFAULT_JD

    # -------- 1️⃣ Extract required skills from JD --------
    required_skills = []
    for skill in COMMON_SKILLS:
        if skill in job_description:
            required_skills.append(skill)

    # -------- 2️⃣ Match resume against JD skills --------
    matched_skills = []
    for skill in required_skills:
        if skill in resume_text:
            matched_skills.append(skill)

    if len(required_skills) == 0:
        skill_score = 0
    else:
        skill_score = (len(matched_skills) / max(len(required_skills), 5)) * 100

    skill_score = min(skill_score, 100)

    # -------- 3️⃣ Semantic Similarity (TF-IDF + Cosine) --------
    vectorizer = TfidfVectorizer(stop_words="english")

    vectors = vectorizer.fit_transform([resume_text, job_description])
    similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]

    semantic_score = similarity * 100

    # -------- 4️⃣ Resume Strength Score --------
    strength_keywords = [
        "project", "developed", "built", "implemented",
        "deployed", "api", "model", "system"
    ]

    strength_count = sum(1 for word in strength_keywords if word in resume_text)
    strength_score = min(strength_count * 10, 100)

    # -------- 5️⃣ Final Weighted Score --------
    final_score = (
        0.4 * semantic_score +
        0.4 * skill_score +
        0.2 * strength_score
    )

    return {
    "resume_score": float(round(final_score, 2)),
    "semantic_score": float(round(semantic_score, 2)),
    "skill_score": float(round(skill_score, 2)),
    "strength_score": float(round(strength_score, 2)),
    "skills_required": required_skills,
    "skills_matched": matched_skills
}