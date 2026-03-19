import os
import subprocess
import sys
from api.mongo_db import seed_curriculum_data

def main():
    print("Welcome to PathFindR Setup & Runner!")
    
    # 1. Seed the Database
    try:
        print("1. Checking Database Connection & Seeding Initial Data...")
        seed_curriculum_data()
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        print("Please ensure your IP is whitelisted in MongoDB Atlas and the connection string in .env is correct.")
        sys.exit(1)

    # 2. Start the Flask Server
    print("\n2. Starting Flask Backend API on http://127.0.0.1:5000 ...")
    print("Leave this window open to keep the server running.\n")
    try:
        # Run Flask development server
        subprocess.run(["python", "api/index.py"], check=True)
    except KeyboardInterrupt:
        print("\nServer shutting down gracefully. Goodbye!")

if __name__ == "__main__":
    main()
