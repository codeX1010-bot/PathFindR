import json
import urllib.parse
from dotenv import load_dotenv
import os
import sys

# Change to api directory to resolve imports
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api'))

from api.mongo_db import get_public_roadmaps, db
from api.ai_engine import get_top_youtube_link

def fix_all_roadmaps():
    roadmaps_collection = db['roadmaps']
    all_roadmaps = list(roadmaps_collection.find({}))
    
    updated_count = 0
    for roadmap in all_roadmaps:
        nodes = roadmap.get("nodes", [])
        changed = False
        
        for node in nodes:
            # Fix video links
            if "video_link" in node and node["video_link"]:
                query = node["video_link"]
                if "youtube.com/watch" not in query and "youtu.be" not in query:
                    if query.startswith("http"):
                        query = f"{node.get('title', '')} tutorial course"
                    print(f"Fixing video link for node: {node.get('title', 'Unknown')}")
                    node["video_link"] = get_top_youtube_link(query)
                    changed = True
                    
            # Fix article links
            if "article_link" in node and node["article_link"]:
                query = node["article_link"]
                if not query.startswith("https://www.google.com/search?q="):
                    if query.startswith("http"):
                        query = f"{node.get('title', '')} tutorial documentation"
                    print(f"Fixing article link for node: {node.get('title', 'Unknown')}")
                    node["article_link"] = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
                    changed = True
                    
            # Fix podcast links
            if "podcast_link" in node and node["podcast_link"]:
                query = node["podcast_link"]
                if not query.startswith("https://open.spotify.com/search/"):
                    if query.startswith("http"):
                        query = f"{node.get('title', '')} podcast"
                    print(f"Fixing podcast link for node: {node.get('title', 'Unknown')}")
                    node["podcast_link"] = f"https://open.spotify.com/search/{urllib.parse.quote(query)}"
                    changed = True
                    
        if changed:
            roadmaps_collection.update_one(
                {"_id": roadmap["_id"]},
                {"$set": {"nodes": nodes}}
            )
            updated_count += 1
            print(f"Updated roadmap ID: {roadmap['_id']}")
            
    print(f"Migration complete. Fixed links in {updated_count} roadmaps.")

if __name__ == "__main__":
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api', '.env'))
    fix_all_roadmaps()
