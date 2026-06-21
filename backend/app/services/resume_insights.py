from dataclasses import dataclass

# Which skill keywords point at which field. A resume is scored against each set
# and the best match wins (ties and no-match fall back to "General").
_FIELD_KEYWORDS: dict[str, set[str]] = {
    "ML / AI": {
        "machine learning", "deep learning", "tensorflow", "pytorch",
        "scikit-learn", "pandas", "numpy", "spark", "hadoop",
    },
    "Frontend": {
        "react", "next.js", "vue", "angular", "tailwind", "html", "css",
        "typescript", "javascript",
    },
    "Backend": {
        "fastapi", "flask", "django", "node.js", "sql", "postgresql", "mysql",
        "mongodb", "redis", "graphql", "rest", "microservices", "kafka", "rabbitmq",
    },
    "DevOps": {
        "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "linux",
        "elasticsearch",
    },
    "Mobile": {"android", "ios"},
}

# Skills worth adding for each field (the gap-to-close suggestions).
_RECOMMENDED_SKILLS: dict[str, list[str]] = {
    "ML / AI": ["MLOps", "Model deployment", "Statistics", "Feature engineering", "LLMs / RAG", "Experiment tracking"],
    "Frontend": ["TypeScript", "Testing (Vitest/Playwright)", "Accessibility (a11y)", "State management", "Web performance"],
    "Backend": ["System design", "Caching", "Message queues", "API security", "Database indexing", "Observability"],
    "DevOps": ["Infrastructure as code", "Observability", "CI/CD pipelines", "Container orchestration", "Cloud cost control"],
    "Mobile": ["State management", "Offline-first design", "App performance", "Push notifications", "CI for mobile"],
    "General": ["System design", "Data structures & algorithms", "Testing", "Git workflows", "Communication"],
}

# A small curated set of free / well-known courses per field.
_COURSES: dict[str, list[dict[str, str]]] = {
    "ML / AI": [
        {"name": "Machine Learning Specialization (Andrew Ng)", "url": "https://www.coursera.org/specializations/machine-learning-introduction"},
        {"name": "Practical Deep Learning (fast.ai)", "url": "https://course.fast.ai/"},
        {"name": "Hugging Face NLP Course", "url": "https://huggingface.co/learn/nlp-course"},
    ],
    "Frontend": [
        {"name": "The Joy of React", "url": "https://www.joyofreact.com/"},
        {"name": "JavaScript30 (Wes Bos)", "url": "https://javascript30.com/"},
        {"name": "web.dev Learn (Google)", "url": "https://web.dev/learn/"},
    ],
    "Backend": [
        {"name": "FastAPI Official Tutorial", "url": "https://fastapi.tiangolo.com/tutorial/"},
        {"name": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"},
        {"name": "Use The Index, Luke (SQL)", "url": "https://use-the-index-luke.com/"},
    ],
    "DevOps": [
        {"name": "Docker Getting Started", "url": "https://docs.docker.com/get-started/"},
        {"name": "Kubernetes Basics", "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/"},
        {"name": "AWS Cloud Practitioner Essentials", "url": "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/"},
    ],
    "Mobile": [
        {"name": "Android Basics with Compose", "url": "https://developer.android.com/courses/android-basics-compose/course"},
        {"name": "100 Days of SwiftUI", "url": "https://www.hackingwithswift.com/100/swiftui"},
        {"name": "Flutter Docs & Codelabs", "url": "https://docs.flutter.dev/get-started/codelab"},
    ],
    "General": [
        {"name": "CS50 (Harvard)", "url": "https://cs50.harvard.edu/x/"},
        {"name": "The Odin Project", "url": "https://www.theodinproject.com/"},
        {"name": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"},
    ],
}

# Resume rubric: each section found is worth 20 points. Chosen for signal
# (what a real reviewer looks for), not filler like "declaration" or "hobbies".
_SECTIONS: list[tuple[tuple[str, ...], str]] = [
    (("summary", "objective", "about me"), "Summary / objective"),
    (("experience", "internship", "employment"), "Work / internship experience"),
    (("project", "portfolio"), "Projects"),
    (("education", "b.tech", "bachelor", "degree", "university"), "Education"),
    (("achievement", "award", "certification", "certificate"), "Achievements / certifications"),
]


@dataclass
class ResumeInsights:
    predicted_field: str
    resume_score: int
    resume_tips: list[dict]
    recommended_skills: list[str]
    courses: list[dict]


def _predict_field(skills: list[str]) -> str:
    have = {s.lower() for s in skills}
    best_field, best_hits = "General", 0
    for field, keywords in _FIELD_KEYWORDS.items():
        hits = len(have & keywords)
        if hits > best_hits:
            best_field, best_hits = field, hits
    return best_field


def _score_resume(text: str) -> tuple[int, list[dict]]:
    lowered = text.lower()
    score = 0
    tips: list[dict] = []
    for keywords, label in _SECTIONS:
        present = any(k in lowered for k in keywords)
        if present:
            score += 20
            tips.append({"present": True, "text": f"{label} section found"})
        else:
            tips.append({"present": False, "text": f"Add a {label} section"})
    return score, tips


def build_insights(text: str, skills: list[str]) -> ResumeInsights:
    field = _predict_field(skills)
    score, tips = _score_resume(text)
    have = {s.lower() for s in skills}
    recommended = [s for s in _RECOMMENDED_SKILLS.get(field, []) if s.lower() not in have]
    return ResumeInsights(
        predicted_field=field,
        resume_score=score,
        resume_tips=tips,
        recommended_skills=recommended,
        courses=_COURSES.get(field, _COURSES["General"]),
    )
