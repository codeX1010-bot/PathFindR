import os
from google import genai
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("No GEMINI_API_KEY set in .env file")

# Initialize the new SDK client
client = genai.Client(api_key=GEMINI_API_KEY)

def generate_ai_roadmap(prompt, learning_style, current_skills):
    """
    Calls the Gemini API to generate a structured JSON roadmap.
    """
    system_instruction = f"""
    You are PathFindR, an advanced AI learning GPS. The user wants to learn exactly what they prompted: "{prompt}".
    They prefer to learn via: "{learning_style}".
    They already have some baseline skills: {', '.join(current_skills) if current_skills else 'None'}.
    
    You must structure your response ONLY as a raw JSON array of objects representing nodes in a learning sequence. 
    Do not include markdown blocks like ```json. Just raw text starting with [ and ending with ].
    Generate between 5 and 7 logical steps for them to achieve this goal from scratch (skipping the skills they already know).

    Each object must have exactly these keys:
    - "id": a unique string (e.g., "node_1")
    - "title": The title of this step
    - "description": A short explanation of what they will learn here
    - "estimated_time_mins": An integer representing how many minutes this step takes
    - "difficulty_level": An integer from 1 (Beginner) to 5 (Master)
    - "checklist": An array of 3 specific, actionable mini-goals or concepts to master within this step.
    - "video_link": A highly relevant direct YouTube URL for this specific topic step.
    - "article_link": A highly relevant direct URL to an official documentation page, blog, or written tutorial (like MDN, Python.org, etc).
    - "podcast_link": A highly relevant direct URL to a podcast episode, audio-friendly deep dive, or an audio guide if applicable. Provide URLs with high confidence to prevent 404s.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=system_instruction
        )
        
        # Strip any accidental markdown formatting the model might add 
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        roadmap_nodes = json.loads(response_text)
        return roadmap_nodes
        
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None

def validate_knowledge(node_title, node_description, user_answer):
    """
    Evaluates if the user's answer demonstrates sufficient understanding of the node topic.
    Returns: {"passed": bool, "feedback": str}
    """
    system_instruction = f"""
    You are an expert tutor for PathFindR. The student is learning: "{node_title}".
    The topic covers: "{node_description}".
    
    The student was asked to explain or demonstrate their knowledge of this topic.
    Here is their answer: "{user_answer}"
    
    Evaluate their answer. If it shows they understand the core concept (even basically), they pass.
    If it is completely wrong, irrelevant, "I don't know", or too brief to judge, they fail.
    
    Output strictly as a raw JSON object with no markdown formatting:
    {{
        "passed": true|false,
        "feedback": "A short, encouraging sentence explaining why they passed or what they misunderstood."
    }}
    """
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=system_instruction
        )
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        return json.loads(response_text)
    except Exception as e:
        print(f"Error validating knowledge: {e}")
        return {"passed": False, "feedback": "Sorry, the AI tutor is currently unavailable. Try again later."}
