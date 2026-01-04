import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
});

export const generateRoadmapAI = async (goal, knowledge, style) => {
    try {
        const prompt = `
      Create a step-by-step learning roadmap for: "${goal}".
      Current Knowledge Level: "${knowledge}".
      Preferred Learning Style: "${style}".
      
      Return ONLY a VALID JSON array.Do not include any markdown formatting(like \`\`\`json).
      
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
        {
          "title": "Topic 1",
          "description": "Desc...",
          "links": [{"label": "Search Video: Topic 1", "url": "https://www.youtube.com/results?search_query=Topic+1"}]
        }
      ]
      
      Adjust the content depth based on the knowledge level.
      Adjust the resource types based on the learning style.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error(`Failed to generate content via Gemini: ${error.message}`);
    }
};
