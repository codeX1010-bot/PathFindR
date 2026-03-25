import os
from groq import Groq
import json
import urllib.parse
from dotenv import load_dotenv
from youtubesearchpython import VideosSearch

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("No GROQ_API_KEY set in .env file")

# Initialize the Groq client
client = Groq(api_key=GROQ_API_KEY)

# Use Llama-3 for high speed and reasoning
MODEL_NAME = "llama-3.3-70b-versatile"

def get_top_youtube_link(query):
    """
    Fetches the actual link of the top YouTube search result for a given query.
    If it fails, it returns a standard YouTube search URL.
    """
    try:
        videos_search = VideosSearch(query, limit=1)
        results = videos_search.result()
        if results and results.get('result') and len(results['result']) > 0:
            return results['result'][0]['link']
    except Exception as e:
        print(f"YouTube search error for '{query}': {e}")
    
    # Fallback to search query link
    return f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"

def generate_ai_roadmap(prompt, learning_style, current_skills):
    """
    Calls the Groq API to generate a structured JSON roadmap.
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
    - "video_link": A highly specific YouTube search phrase (e.g. "React Hooks full course 2024"). Do NOT provide URLs.
    - "article_link": A Google search phrase for reading material (e.g. "React Hooks tutorial documentation"). Do NOT provide URLs.
    - "podcast_link": A Spotify search phrase for a podcast (e.g. "React Hooks podcast"). Do NOT provide URLs.
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": system_instruction
                }
            ],
            model=MODEL_NAME,
            temperature=0.5,
        )
        
        # Strip any accidental markdown formatting
        response_text = chat_completion.choices[0].message.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        roadmap_nodes = json.loads(response_text)
        
        # Post-process: Fetch real YouTube links and construct reliable search links
        for node in roadmap_nodes:
            # Video Link
            if "video_link" in node and node["video_link"]:
                query = node["video_link"]
                if query.startswith("http"):
                    query = f"{node['title']} tutorial course"
                node["video_link"] = get_top_youtube_link(query)
            else:
                node["video_link"] = get_top_youtube_link(f"{node['title']} tutorial course")

            # Article Link
            if "article_link" in node and node["article_link"]:
                query = node["article_link"]
                if query.startswith("http"):
                    query = f"{node['title']} tutorial documentation"
                node["article_link"] = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
            else:
                query = f"{node['title']} tutorial documentation"
                node["article_link"] = f"https://www.google.com/search?q={urllib.parse.quote(query)}"

            # Podcast Link
            if "podcast_link" in node and node["podcast_link"]:
                query = node["podcast_link"]
                if query.startswith("http"):
                    query = f"{node['title']} podcast"
                node["podcast_link"] = f"https://open.spotify.com/search/{urllib.parse.quote(query)}"
            else:
                query = f"{node['title']} podcast"
                node["podcast_link"] = f"https://open.spotify.com/search/{urllib.parse.quote(query)}"

        return roadmap_nodes
        
    except Exception as e:
        print(f"Error calling Groq API: {e}")
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
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": system_instruction
                }
            ],
            model=MODEL_NAME,
            temperature=0.2,
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        return json.loads(response_text)
    except Exception as e:
        print(f"Error validating knowledge with Groq: {e}")
        return {"passed": False, "feedback": "Sorry, the AI tutor is currently unavailable. Try again later."}
