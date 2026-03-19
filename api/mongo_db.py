import os
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt
from datetime import datetime

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("No MONGO_URI set in .env file")

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client.pathfindr_db  # Create or use the pathfindr_db database

# Collections
users_collection = db.users
curriculum_collection = db.curriculum
roadmaps_collection = db.roadmaps  # New collection for saved AI roadmaps

# --- Auth Functions ---

def register_user(email, password, name):
    """Registers a new user with a hashed password."""
    try:
        # Check if user already exists
        if users_collection.find_one({"email": email}):
            return None, "User already exists"
            
        # Hash password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
        
        user_data = {
            "email": email,
            "password": hashed_password,
            "name": name,
            "created_at": datetime.utcnow()
        }
        
        result = users_collection.insert_one(user_data)
        return str(result.inserted_id), None
    except Exception as e:
        print(f"MongoDB Error: {e}")
        return None, f"Database connection failed: {str(e)}"

def verify_user(email, password):
    """Verifies a user's credentials."""
    try:
        user = users_collection.find_one({"email": email})
        if not user:
            return None
            
        if bcrypt.checkpw(password.encode('utf-8'), user['password']):
            return str(user['_id'])
        return None
    except Exception as e:
        print(f"MongoDB Error in verify_user: {e}")
        return None

def get_user_by_id(user_id):
    """Fetches user details safely (without password)."""
    from bson.objectid import ObjectId
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)}, {"password": 0})
        if user:
            user['_id'] = str(user['_id'])
        return user
    except Exception as e:
        print(f"MongoDB Error in get_user_by_id: {e}")
        return None

# --- Roadmap Functions ---

def save_ai_roadmap(user_id, prompt, roadmap_nodes):
    """Saves a newly generated AI roadmap to the database."""
    roadmap_data = {
        "user_id": user_id,
        "original_prompt": prompt,
        "nodes": roadmap_nodes,
        "created_at": datetime.utcnow(),
        "completed_node_ids": [],
        "checked_sub_items": {},
        "is_public": False
    }
    result = roadmaps_collection.insert_one(roadmap_data)
    return str(result.inserted_id)

def get_user_roadmaps(user_id):
    """Retrieves all roadmaps saved by a specific user."""
    roadmaps = list(roadmaps_collection.find({"user_id": user_id}).sort("created_at", -1))
    for r in roadmaps:
        r['_id'] = str(r['_id'])
    return roadmaps

def get_public_roadmaps():
    """Retrieves all public roadmaps by any user."""
    roadmaps = list(roadmaps_collection.find({"is_public": True}).sort("created_at", -1).limit(50))
    for r in roadmaps:
        r['_id'] = str(r['_id'])
    return roadmaps

def get_roadmap_by_id(roadmap_id):
    from bson.objectid import ObjectId
    try:
        roadmap = roadmaps_collection.find_one({"_id": ObjectId(roadmap_id)})
        if roadmap:
            roadmap['_id'] = str(roadmap['_id'])
        return roadmap
    except:
        return None

def toggle_roadmap_privacy(roadmap_id, user_id, is_public):
    from bson.objectid import ObjectId
    try:
        result = roadmaps_collection.update_one(
            {"_id": ObjectId(roadmap_id), "user_id": str(user_id)},
            {"$set": {"is_public": is_public}}
        )
        return result.modified_count > 0
    except:
        return False

def update_roadmap_progress(roadmap_id, node_id, is_completed):
    """Updates the completion status of a specific node within a roadmap."""
    from bson.objectid import ObjectId
    try:
        if is_completed:
            roadmaps_collection.update_one(
                {"_id": ObjectId(roadmap_id)},
                {"$addToSet": {"completed_node_ids": node_id}} # Add if not exists
            )
        else:
             roadmaps_collection.update_one(
                {"_id": ObjectId(roadmap_id)},
                {"$pull": {"completed_node_ids": node_id}} # Remove
            )
        return True
    except:
        return False

def update_roadmap_subprogress(roadmap_id, node_id, checked_items_list):
    """Updates the specific sub-items checked for a node."""
    from bson.objectid import ObjectId
    try:
        roadmaps_collection.update_one(
            {"_id": ObjectId(roadmap_id)},
            {"$set": {f"checked_sub_items.{node_id}": checked_items_list}}
        )
        return True
    except:
        return False

def update_roadmap_nodes(user_id, roadmap_id, nodes):
    """Updates the entire nodes array of a roadmap for a user."""
    from bson.objectid import ObjectId
    try:
        result = roadmaps_collection.update_one(
            {"_id": ObjectId(roadmap_id), "user_id": str(user_id)},
            {"$set": {"nodes": nodes}}
        )
        return result.modified_count > 0 or result.matched_count > 0
    except:
        return False

def get_all_curriculum():
    """Returns all learning resources in the database."""
    return list(curriculum_collection.find({}, {"_id": 0}))

def get_user_profile(user_id):
    """Fetches a specific user profile."""
    return users_collection.find_one({"user_id": user_id}, {"_id": 0})

def create_user_profile(user_data):
    """Creates a new user profile."""
    users_collection.insert_one(user_data)
    return True

def update_user_progress(user_id, completed_node_id):
    """Updates the user progress array."""
    users_collection.update_one(
        {"user_id": user_id},
        {"$addToSet": {"completed_nodes": completed_node_id}}
    )
    return True

def seed_curriculum_data():
    """Initial population of the curriculum collection."""
    # Check if data already exists
    if curriculum_collection.count_documents({}) > 0:
        print("Curriculum collection already seeded.")
        return

    # Sample foundational data for the Rule Engine to process
    sample_data = [
        # Data Science
        {
            "id": "ds_01",
            "title": "Python Basics for Data Science",
            "description": "Learn the absolute basics: Variables, Loops, and Functions.",
            "goal_tag": "Data Science",
            "skills_taught": ["Variables", "Loops"],
            "learning_style": "Video",
            "difficulty_level": 1,
            "estimated_time_mins": 45,
            "link": "https://www.youtube.com/watch?v=kqtD5dpn9C8"
        },
         {
            "id": "ds_02",
            "title": "Introduction to Pandas",
            "description": "Learn data manipulation with Pandas.",
            "goal_tag": "Data Science",
            "skills_taught": ["Dataframes"],
            "learning_style": "Article",
            "difficulty_level": 2,
            "estimated_time_mins": 60,
            "link": "https://pandas.pydata.org/docs/getting_started/index.html"
        },
         {
            "id": "ds_03",
            "title": "Data Visualization with Matplotlib",
            "description": "How to draw your first charts and graphs.",
            "goal_tag": "Data Science",
            "skills_taught": ["Visualization"],
            "learning_style": "Video",
            "difficulty_level": 3,
            "estimated_time_mins": 30,
            "link": "https://www.youtube.com/watch?v=UO98lJQ3QGI"
        },

        # Web Dev
        {
            "id": "wd_01",
            "title": "HTML & CSS Full Course",
            "description": "The foundation of all web pages.",
            "goal_tag": "Web Dev",
            "skills_taught": ["HTML", "CSS"],
            "learning_style": "Video",
            "difficulty_level": 1,
            "estimated_time_mins": 120,
            "link": "https://www.youtube.com/watch?v=mU6anWqZJcc"
        },
        {
            "id": "wd_02",
            "title": "JavaScript Basics",
            "description": "Make your web pages interactive.",
            "goal_tag": "Web Dev",
            "skills_taught": ["Variables", "Loops"], # Career switcher from Python would skip this!
            "learning_style": "Interactive",
            "difficulty_level": 2,
            "estimated_time_mins": 90,
            "link": "https://javascript.info/first-steps"
        },
         {
            "id": "wd_03",
            "title": "Intro to React",
            "description": "Build UI components with React.",
            "goal_tag": "Web Dev",
            "skills_taught": ["React"],
            "learning_style": "Video",
            "difficulty_level": 3,
            "estimated_time_mins": 60,
            "link": "https://react.dev/learn"
        }
    ]

    curriculum_collection.insert_many(sample_data)
    print("Successfully seeded curriculum data.")

if __name__ == "__main__":
    seed_curriculum_data()
