import sys
import os

# Set up to import from api folder
sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))
from ai_engine import generate_ai_roadmap
import json

if __name__ == "__main__":
    print("Testing generate_ai_roadmap...")
    # Fast test
    roadmap = generate_ai_roadmap("Basic Python loops", "Visual", [])
    
    if roadmap:
        print("Successfully generated roadmap!")
        for node in roadmap:
            print(f"- Node: {node.get('title')}")
            print(f"  Video link: {node.get('video_link')}")
            print(f"  Article link: {node.get('article_link')}")
            print(f"  Podcast link: {node.get('podcast_link')}")
    else:
        print("Error: returned None")
