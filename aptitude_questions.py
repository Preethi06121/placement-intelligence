import random

APTITUDE_QUESTIONS = [
    {
        "question": "If a train travels 60 km in 1 hour, how far will it travel in 2.5 hours?",
        "options": ["120 km", "150 km", "180 km", "200 km"],
        "answer": "150 km"
    },
    {
        "question": "What is 20% of 250?",
        "options": ["40", "45", "50", "55"],
        "answer": "50"
    },
    {
        "question": "If 5 workers complete a task in 10 days, how many days will 10 workers take?",
        "options": ["5", "10", "15", "20"],
        "answer": "5"
    },
    {
        "question": "A number is increased by 20% and becomes 120. What was the original number?",
        "options": ["80", "90", "100", "110"],
        "answer": "100"
    },
    {
        "question": "What is the next number in the series: 2, 6, 12, 20, ?",
        "options": ["30", "32", "36", "40"],
        "answer": "30"
    },
    {
        "question": "If the ratio of boys to girls is 3:2 and total students are 50, how many girls?",
        "options": ["20", "25", "30", "15"],
        "answer": "20"
    },
    {
        "question": "What is the simple interest on ₹1000 at 10% for 2 years?",
        "options": ["200", "150", "100", "250"],
        "answer": "200"
    },
    {
        "question": "If a man can do a job in 5 days, how many jobs can he do in 20 days?",
        "options": ["4", "5", "3", "2"],
        "answer": "4"
    }
]

def get_random_aptitude_questions(count=5):
    return random.sample(APTITUDE_QUESTIONS, min(count, len(APTITUDE_QUESTIONS)))