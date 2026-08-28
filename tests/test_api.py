import io
import unittest
from unittest.mock import patch

from app import create_app
from app.extensions import db
from leetcode_analyzer import CodingPlatformUnavailable


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            "TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite://",
            "SECRET_KEY": "test-secret", "JWT_SECRET_KEY": "test-jwt-secret-with-at-least-thirty-two-characters",
            "RATELIMIT_ENABLED": False,
        })
        with self.app.app_context():
            db.create_all()
        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def signup(self, email="student@example.com"):
        response = self.client.post("/api/signup", json={"email": email, "password": "password123"})
        self.assertEqual(response.status_code, 201)
        return response.get_json()["access_token"]

    @staticmethod
    def auth(token):
        return {"Authorization": f"Bearer {token}"}

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")

    def test_signup_and_login(self):
        self.assertTrue(self.signup())
        response = self.client.post("/api/login", json={"email": "student@example.com", "password": "password123"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["access_token"])

    def test_invalid_login(self):
        self.signup()
        response = self.client.post("/api/login", json={"email": "student@example.com", "password": "wrong"})
        self.assertEqual(response.status_code, 401)

    def test_protected_endpoint_requires_jwt(self):
        response = self.client.get("/api/dashboard")
        self.assertEqual(response.status_code, 401)
        self.assertIn("error", response.get_json())

    def test_resume_validation(self):
        token = self.signup()
        response = self.client.post("/api/resume/upload", headers=self.auth(token), data={
            "resume": (io.BytesIO(b"not a pdf"), "resume.txt")
        })
        self.assertEqual(response.status_code, 400)

    def test_oversized_resume_returns_json_error(self):
        token = self.signup()
        self.app.config["MAX_CONTENT_LENGTH"] = 5
        response = self.client.post("/api/resume/upload", headers=self.auth(token), data={
            "resume": (io.BytesIO(b"%PDF-too-large"), "resume.pdf")
        })
        self.assertEqual(response.status_code, 413)
        self.assertIn("error", response.get_json())

    def test_assessment_submission(self):
        token = self.signup()
        questions = self.client.get("/api/cs_test", headers=self.auth(token)).get_json()["questions"]
        response = self.client.post("/api/cs_test", headers=self.auth(token),
                                    json={"answers": [q["options"][0] for q in questions]})
        self.assertEqual(response.status_code, 200)
        self.assertIn("score", response.get_json())

    def test_assessment_state_is_not_reused_by_another_jwt_user(self):
        first_token = self.signup()
        self.client.get("/api/cs_test", headers=self.auth(first_token))
        second_token = self.signup("another@example.com")
        response = self.client.post("/api/cs_test", headers=self.auth(second_token), json={"answers": []})
        self.assertEqual(response.status_code, 400)
        self.assertIn("not initialized", response.get_json()["error"])

    def test_coding_platform_failure_returns_safe_gateway_error(self):
        token = self.signup()
        with patch("app.api.routes.analyze_leetcode_profile", side_effect=CodingPlatformUnavailable()):
            response = self.client.post("/api/coding_analysis", headers=self.auth(token),
                                        json={"leetcode_url": "https://leetcode.com/u/example/"})
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.get_json(), {
            "success": False,
            "error": {
                "code": "CODING_PLATFORM_UNAVAILABLE",
                "message": "Unable to reach the coding platform right now. Please try again later.",
            },
        })

    def test_coding_analysis_success_response_is_preserved(self):
        token = self.signup()
        stats = {
            "total_stats": {"easy": 10, "medium": 5, "hard": 1, "total": 16},
            "topic_count": {"Array": 4},
        }
        with patch("app.api.routes.analyze_leetcode_profile", return_value=stats):
            response = self.client.post("/api/coding_analysis", headers=self.auth(token),
                                        json={"leetcode_url": "https://leetcode.com/u/example/"})
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["total_stats"], stats["total_stats"])
        self.assertEqual(payload["topic_count"], stats["topic_count"])
        self.assertIn("score", payload)
        self.assertIn("feedback", payload)

    def test_full_analysis_and_dashboard(self):
        token = self.signup()
        with patch("app.api.routes.analyze_uploaded_resume", return_value=({"resume_score": 70.0}, "text")):
            response = self.client.post("/api/full_analysis", headers=self.auth(token), data={
                "resume": (io.BytesIO(b"%PDF"), "resume.pdf"), "job_description": "Python developer"
            })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["attempt"]["resume_score"], 70.0)
        dashboard = self.client.get("/api/dashboard", headers=self.auth(token))
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(len(dashboard.get_json()["attempts"]), 1)


if __name__ == "__main__":
    unittest.main()
