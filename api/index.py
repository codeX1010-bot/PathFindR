import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import jwt
import datetime
from functools import wraps

from mongo_db import (
    register_user, verify_user, get_user_by_id, 
    save_ai_roadmap, get_user_roadmaps, update_roadmap_progress,
    update_roadmap_subprogress, get_public_roadmaps, get_roadmap_by_id, toggle_roadmap_privacy
)
from ai_engine import generate_ai_roadmap, validate_knowledge

load_dotenv()

app = Flask(__name__)
# Enable CORS for frontend to talk to backend
CORS(app, resources={r"/*": {"origins": "*"}})

# JWT Secret
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback_development_secret_key_123')

# --- Middleware ---

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Handle Bearer token in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = get_user_by_id(data['user_id'])
            if not current_user:
                raise Exception("User not found")
        except:
            return jsonify({'message': 'Token is invalid or expired!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# --- Auth Routes ---

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({"error": "Missing required fields"}), 400
        
    user_id, error = register_user(data['email'], data['password'], data['name'])
    
    if error:
        return jsonify({"error": error}), 409
        
    return jsonify({"message": "Successfully registered", "user_id": user_id}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400
        
    user_id = verify_user(data['email'], data['password'])
    
    if not user_id:
        return jsonify({"error": "Invalid credentials"}), 401
        
    # Generate JWT
    token = jwt.encode({
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    user_details = get_user_by_id(user_id)
    
    return jsonify({
        "token": token,
        "user": {
            "id": user_id,
            "name": user_details.get("name"),
            "email": user_details.get("email")
        }
    }), 200

# --- App Routes (Protected) ---

@app.route('/api/generate_roadmap', methods=['POST'])
@token_required
def generate_roadmap(current_user):
    data = request.json
    prompt = data.get('prompt')
    learning_style = data.get('learning_style', 'Mixed')
    current_skills = data.get('current_skills', [])
    
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400
        
    # Call Gemini
    roadmap_nodes = generate_ai_roadmap(prompt, learning_style, current_skills)
    
    if not roadmap_nodes:
        return jsonify({"error": "Failed to generate roadmap from AI. Try again."}), 500
        
    # Save the generated roadmap structurally to MongoDB
    roadmap_id = save_ai_roadmap(str(current_user['_id']), prompt, roadmap_nodes)
    
    return jsonify({
        "message": "Roadmap generated",
        "roadmap_id": roadmap_id,
        "nodes": roadmap_nodes
    }), 201

@app.route('/api/roadmaps', methods=['GET'])
@token_required
def get_user_saved_roadmaps(current_user):
    roadmaps = get_user_roadmaps(str(current_user['_id']))
    return jsonify({"roadmaps": roadmaps}), 200

@app.route('/api/community/roadmaps', methods=['GET'])
def get_community_roadmaps():
    roadmaps = get_public_roadmaps()
    return jsonify({"roadmaps": roadmaps}), 200

@app.route('/api/roadmaps/<roadmap_id>/publish', methods=['POST'])
@token_required
def toggle_publish(current_user, roadmap_id):
    data = request.json
    is_public = data.get("is_public", True)
    
    success = toggle_roadmap_privacy(roadmap_id, current_user['_id'], is_public)
    if success:
        return jsonify({"message": "Privacy updated"}), 200
    return jsonify({"error": "Failed to update privacy"}), 500

@app.route('/api/roadmaps/<roadmap_id>/fork', methods=['POST'])
@token_required
def fork_roadmap(current_user, roadmap_id):
    # Fetch the original roadmap
    original = get_roadmap_by_id(roadmap_id)
    if not original:
        return jsonify({"error": "Roadmap not found"}), 404
        
    # We only copy the nodes and prompt, we assign it to the new user and reset progress
    from mongo_db import save_ai_roadmap
    new_roadmap_id = save_ai_roadmap(str(current_user['_id']), original['original_prompt'], original['nodes'])
    
    return jsonify({
        "message": "Roadmap forked successfully", 
        "roadmap_id": new_roadmap_id
    }), 201

@app.route('/api/roadmaps/<roadmap_id>', methods=['PUT'])
@token_required
def update_roadmap(current_user, roadmap_id):
    data = request.json
    nodes = data.get("nodes")
    
    if nodes is None:
         return jsonify({"error": "Nodes array is required"}), 400
         
    from mongo_db import update_roadmap_nodes
    success = update_roadmap_nodes(str(current_user['_id']), roadmap_id, nodes)
    
    if success:
        return jsonify({"message": "Roadmap updated successfully"}), 200
    return jsonify({"error": "Failed to update roadmap"}), 500

@app.route('/api/progress/<roadmap_id>', methods=['POST'])
@token_required
def mark_progress(current_user, roadmap_id):
    """Marks a specific curriculum node inside a specific roadmap as complete."""
    data = request.json
    node_id = data.get("node_id")
    is_completed = data.get("is_completed", True)
    
    if not node_id:
        return jsonify({"error": "Node ID required"}), 400
        
    success = update_roadmap_progress(roadmap_id, node_id, is_completed)
    
    if success:
        return jsonify({"message": "Progress updated"}), 200
    return jsonify({"error": "Failed to update progress"}), 500

@app.route('/api/progress/subitem/<roadmap_id>', methods=['POST'])
@token_required
def mark_subprogress(current_user, roadmap_id):
    """Marks specific sub-goals as checked within a node."""
    data = request.json
    node_id = data.get("node_id")
    checked_items = data.get("checked_items", [])
    
    if not node_id:
        return jsonify({"error": "Node ID required"}), 400
        
    success = update_roadmap_subprogress(roadmap_id, node_id, checked_items)
    
    if success:
        return jsonify({"message": "Sub-progress updated"}), 200
    return jsonify({"error": "Failed to update sub-progress"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "running"}), 200

@app.route('/api/progress/validate', methods=['POST'])
@token_required
def validate_progress(current_user):
    data = request.json
    node_title = data.get('node_title')
    node_desc = data.get('node_description')
    answer = data.get('user_answer')
    
    if not node_title or not answer:
        return jsonify({"error": "Missing required fields"}), 400
        
    result = validate_knowledge(node_title, node_desc, answer)
    return jsonify(result), 200

if __name__ == '__main__':
    # Running on port 5000 by default
    app.run(debug=True, port=5000)
