from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

print("DEBUG: Loading api/index.py... Model configured: gemini-flash-latest")


# Initialize Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment variables")

def generate_roadmap_ai(goal, knowledge, style):
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY is not configured")
        
    try:
        # Prepare payload for Gemini HTTP API
        # Switching to gemini-flash-latest to bypass 2.0-flash daily quota limits
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
        print(f"DEBUG: Calling Gemini API with URL: {url}")
        
        prompt = f"""
      Create a step-by-step learning roadmap for: "{goal}".
      Current Knowledge Level: "{knowledge}".
      Preferred Learning Style: "{style}".
      
      Return ONLY a VALID JSON array. Do not include any markdown formatting (like ```json or ```).
      
      The JSON structure must be an array of objects, where each object has:
      - "title": string
      - "description": string (1-2 sentences)
      - "links": array of objects with "label" and "url"
      
      CRITICAL INSTRUCTION FOR LINKS:
      - Do NOT make up specific video or article URLs (e.g. youtube.com/watch?v=xyz) because they might not exist.
      - Instead, generate SEARCH QUERY URLs. 
      - If style is "Visual", use YouTube Search URLs: "https://www.youtube.com/results?search_query=TOPIC+NAME"
      - If style is "Reading" or "Hands-on", use Google Search URLs: "https://www.google.com/search?q=TOPIC+NAME+tutorial"
      - You can also use highly stable official documentation URLs (e.g., python.org, react.dev) if you are 100% sure they exist.
      - NEVER use "example.com" or "placeholder.com".
      
      Example format:
      [
        {{
          "title": "Topic 1",
          "description": "Desc...",
          "links": [{{"label": "Search Video: Topic 1", "url": "https://www.youtube.com/results?search_query=Topic+1"}}]
        }}
      ]
      
      Adjust the content depth based on the knowledge level.
      Adjust the resource types based on the learning style.
    """
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        
        import time
        max_retries = 3
        for attempt in range(max_retries):
            response = requests.post(url, json=payload)
            
            if response.status_code == 200:
                break
            elif response.status_code == 429:
                wait_time = 5
                print(f"Rate limit hit. Retrying in {wait_time} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
            else:
                # Other errors, don't retry, just raise
                raise Exception(f"Gemini API Error {response.status_code}: {response.text}")
        else:
             # Loop finished without breaking
            raise Exception(f"Gemini API Error {response.status_code}: {response.text} (Max retries exceeded)")
        
        if response.status_code != 200:
            raise Exception(f"Gemini API Error {response.status_code}: {response.text}")
            
        result = response.json()
        
        # safely extract text from response structure
        try:
            text = result['candidates'][0]['content']['parts'][0]['text']
        except (KeyError, IndexError):
             raise Exception(f"Invalid API response format: {result}")

        # Clean up markdown if present
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        text = text.strip()
        
        # Try to find the JSON array/object start and end if there's extra text
        json_start = text.find('[')
        json_end = text.rfind(']') + 1
        if json_start != -1 and json_end != -1:
             text = text[json_start:json_end]
             
        return json.loads(text)
    except Exception as e:
        print(f"AI Generation Error: {e}")
        raise Exception(f"Failed to generate content via Gemini: {str(e)}")

@app.route('/api/health', methods=['GET'])
def health_check():
    status = {"status": "ok", "message": "Backend is running"}
    try:
        import requests
        status["dependencies"] = "requests installed"
    except ImportError as e:
        status["dependencies"] = f"requests missing: {e}"
        return jsonify(status), 500
    return jsonify(status), 200

@app.route('/api/generate-roadmap', methods=['POST', 'OPTIONS'])
def generate_roadmap():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.json
        goal = data.get('goal')
        knowledge = data.get('knowledge')
        style = data.get('style')

        if not goal:
            return jsonify({'error': 'Goal is required'}), 400

        print(f"Generating roadmap regarding: {goal}, Level: {knowledge}, Style: {style}")

        # Call AI module
        roadmap = generate_roadmap_ai(goal, knowledge, style)

        return jsonify(roadmap)
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        return jsonify({'error': 'Failed to generate roadmap', 'details': str(e)}), 500

# For local development
if __name__ == '__main__':
    port = int(os.getenv('PORT', 3001))
    app.run(port=port)
