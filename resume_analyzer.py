import re

skills_db = [
    "python",
    "java",
    "c++",
    "sql",
    "machine learning",
    "data structures",
    "algorithms",
    "flask",
    "django",
    "postgresql",
    "react",
    "javascript",
]

def analyze_resume(text):
    text = text.lower()
    
    found_skills = []
    
    for skill in skills_db:
        if re.search(r'\b' + re.escape(skill) + r'\b', text):
            found_skills.append(skill)
    
    score = (len(found_skills) / len(skills_db)) * 100
    
    return {
        "skills_found": found_skills,
        "resume_score": round(score, 2)
    }

