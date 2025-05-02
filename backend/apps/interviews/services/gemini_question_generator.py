import os
import google.generativeai as genai
import re

class GeminiQuestionGenerator:
    def __init__(self):
        api_key = "AIzaSyANqoosqOQ0hItxouSxNQMO4KQtiJFexf4"  # Replace this with your API key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def generate_questions(self, category: str) -> list[str]:
        prompt = f"""Generate 10 interview questions for the category: {category}.
        Make them concise, job-relevant, and challenging.
        Format them as a numbered list from 1-10.
        Each question should be on a new line starting with a number."""

        response = self.model.generate_content(prompt)
        text = response.text

        # Extract numbered questions using regex
        questions = []
        pattern = r'^\d+\.\s*(.+)$'
        
        for line in text.split('\n'):
            line = line.strip()
            match = re.match(pattern, line)
            if match:
                question = match.group(1).strip()
                questions.append(question)

        return questions[:10]  # Ensure we only return 10 questions

def get_question_generator() -> GeminiQuestionGenerator:
    return GeminiQuestionGenerator() 