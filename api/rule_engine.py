import random

# Rule Engine Logic

def generate_roadmap(user_profile, all_curriculum):
    """
    Generates a personalized learning roadmap based on the User's:
    - Goal (Filtering)
    - Current Skills (Exclusion)
    - Learning Style (Weighting)
    """
    goal = user_profile.get("goal")
    current_skills = set(user_profile.get("current_skills", []))
    preferred_style = user_profile.get("learning_style")
    
    roadmap = []

    for item in all_curriculum:
        # FR-2.1: Filtering by Goal
        if item.get("goal_tag") != goal:
            continue
            
        # FR-2.2: Exclusion (If user already has ANY of the skills taught, skip it)
        skills_taught = set(item.get("skills_taught", []))
        if current_skills.intersection(skills_taught):
           continue
           
        # Calculate Relevance Score
        relevance_score = 0
        
        # FR-2.3: Weighting (Match learning style)
        if item.get("learning_style") == preferred_style:
            relevance_score += 10
            
        # Slight randomization so users with exact same profile don't see exact same order if difficulty matches
        relevance_score += random.uniform(0, 1)

        roadmap.append({
            "item_data": item,
            "relevance_score": relevance_score
        })

    # Sort primarily by Difficulty Level (FR-2.4), and secondarily by Relevance Score
    # We want difficulty ascending (1, 2, 3) 
    # But for a tie in difficulty, we want highest relevance score first (Descending)
    roadmap.sort(key=lambda x: (x["item_data"].get("difficulty_level", 1), -x["relevance_score"]))
    
    # Extract just the data back out into a clean list
    final_roadmap = [entry["item_data"] for entry in roadmap]
    return final_roadmap
