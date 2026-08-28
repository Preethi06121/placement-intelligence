def public_questions(questions):
    return [{"question": q["question"], "options": q["options"]} for q in questions]


def grade_answers(questions, answers):
    if not isinstance(answers, list) or len(answers) != len(questions):
        raise ValueError("answers must be a list with one entry per question")
    if any(not isinstance(answer, str) or not answer.strip() for answer in answers):
        raise ValueError("every question must have a valid answer")

    results, score = [], 0
    for question, selected in zip(questions, answers):
        correct = question["answer"]
        is_correct = selected == correct
        score += int(is_correct)
        results.append({"question": question["question"], "selected": selected,
                        "correct": correct, "is_correct": is_correct})
    return (score / len(questions)) * 100, results
