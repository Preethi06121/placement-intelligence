import requests
import time

GRAPHQL_URL = "https://leetcode.com/graphql"

HEADERS = {
    "Content-Type": "application/json",
    "Referer": "https://leetcode.com"
}


def graphql_query(query, variables):
    response = requests.post(
        GRAPHQL_URL,
        json={"query": query, "variables": variables},
        headers=HEADERS
    )
    return response.json()


# -------------------------------------------------
# 1️⃣ Get REAL total solved + difficulty breakdown
# -------------------------------------------------
def fetch_total_stats(username):
    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
    """

    variables = {"username": username}
    data = graphql_query(query, variables)

    if "data" not in data or data["data"]["matchedUser"] is None:
        return None

    stats = data["data"]["matchedUser"]["submitStatsGlobal"]["acSubmissionNum"]

    result = {}
    for item in stats:
        result[item["difficulty"]] = item["count"]

    return {
        "easy": result.get("Easy", 0),
        "medium": result.get("Medium", 0),
        "hard": result.get("Hard", 0),
        "total": result.get("All", 0)
    }


# -------------------------------------------------
# 2️⃣ Get recent accepted problems for topic analysis
# -------------------------------------------------
def fetch_recent_slugs(username, limit=150):
    query = """
    query getUserSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        titleSlug
      }
    }
    """

    variables = {"username": username, "limit": limit}
    data = graphql_query(query, variables)

    if "data" not in data:
        return []

    submissions = data["data"]["recentAcSubmissionList"]

    unique_slugs = list({s["titleSlug"] for s in submissions})
    return unique_slugs


def fetch_problem_topics(slug):
    query = """
    query getQuestion($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        topicTags {
          name
        }
      }
    }
    """

    variables = {"titleSlug": slug}
    data = graphql_query(query, variables)

    if "data" not in data or data["data"]["question"] is None:
        return []

    tags = data["data"]["question"]["topicTags"]
    return [tag["name"] for tag in tags]


# -------------------------------------------------
# 3️⃣ Full profile analysis
# -------------------------------------------------
def analyze_leetcode_profile(username, limit=150):
    total_stats = fetch_total_stats(username)

    if not total_stats:
        return None

    slugs = fetch_recent_slugs(username, limit)

    topic_count = {}

    for slug in slugs:
        topics = fetch_problem_topics(slug)

        for topic in topics:
            topic_count[topic] = topic_count.get(topic, 0) + 1

        time.sleep(0.03)

    return {
        "total_stats": total_stats,
        "topic_count": topic_count
    }


# -------------------------------------------------
# 4️⃣ Advanced scoring model
# -------------------------------------------------
def calculate_advanced_coding_score(stats):
    total_stats = stats["total_stats"]
    topic_count = stats["topic_count"]

    easy = total_stats["easy"]
    medium = total_stats["medium"]
    hard = total_stats["hard"]
    total = total_stats["total"]

    # Topic Coverage (60%) — scaled contribution
    if topic_count:
        topic_contributions = [
            min(count / 10, 1) for count in topic_count.values()
        ]
        topic_score = (sum(topic_contributions) / len(topic_contributions)) * 60
    else:
        topic_score = 0

    # Difficulty Depth (25%)
    weighted = (medium * 2 + hard * 3)
    depth_score = min(weighted / 800, 1) * 25

    # Volume (15%)
    volume_score = min(total / 300, 1) * 15

    final_score = topic_score + depth_score + volume_score

    return round(final_score, 2)


# -------------------------------------------------
# 5️⃣ Topic → Resource Mapping
# -------------------------------------------------
TOPIC_RESOURCES = {
    "Dynamic Programming": "Practice Knapsack, LIS, and Grid DP patterns.",
    "Graph": "Focus on BFS, DFS, Dijkstra, and Topological Sort.",
    "Tree": "Revise Tree Traversals and recursive patterns.",
    "Binary Tree": "Practice level order, diameter, and path sum problems.",
    "Array": "Work on prefix sum, sliding window, and two pointers.",
    "String": "Practice hashing and sliding window techniques.",
    "Hash Table": "Focus on frequency maps and optimization tricks.",
    "Stack": "Revise monotonic stack and expression evaluation.",
    "Queue": "Practice BFS and sliding window max problems.",
    "Trie": "Work on prefix search and word dictionary problems.",
    "Sliding Window": "Practice substring and subarray window problems.",
    "Union-Find": "Study Disjoint Set Union and connected components.",
    "Math": "Revise number theory basics and combinatorics.",
}


# -------------------------------------------------
# 6️⃣ Rule-based feedback engine
# -------------------------------------------------
def generate_feedback(stats, score):
    total_stats = stats["total_stats"]
    topic_count = stats["topic_count"]

    strengths = []
    moderate = []
    weaknesses = []
    recommendations = []

    for topic, count in topic_count.items():
        if count >= 8:
            strengths.append(topic)
        elif count >= 4:
            moderate.append(topic)
        else:
            weaknesses.append(topic)
            if topic in TOPIC_RESOURCES:
                recommendations.append(
                    f"{topic}: {TOPIC_RESOURCES[topic]}"
                )

    suggestions = []

    if total_stats["hard"] < 5:
        suggestions.append("Increase Hard problem solving.")

    if total_stats["medium"] < 20:
        suggestions.append("Solve more Medium level problems.")

    if len(strengths) < 5:
        suggestions.append("Improve topic diversity across domains.")

    if score >= 70:
        readiness = "READY"
    elif score >= 45:
        readiness = "ALMOST READY"
    else:
        readiness = "NOT READY"

    return {
        "strengths": strengths,
        "moderate": moderate,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "suggestions": suggestions,
        "readiness": readiness
    }