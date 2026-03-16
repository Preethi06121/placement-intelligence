import random

QUESTIONS = [
    {
        "question": "What is the time complexity of Binary Search?",
        "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        "answer": "O(log n)"
    },
    {
        "question": "Which data structure uses FIFO?",
        "options": ["Stack", "Queue", "Tree", "Graph"],
        "answer": "Queue"
    },
    {
        "question": "What is the worst case time complexity of QuickSort?",
        "options": ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
        "answer": "O(n^2)"
    },
    {
        "question": "Which protocol is used for secure communication?",
        "options": ["HTTP", "FTP", "HTTPS", "TCP"],
        "answer": "HTTPS"
    },
]

def get_random_questions():
    return random.sample(QUESTIONS, min(20, len(QUESTIONS)))