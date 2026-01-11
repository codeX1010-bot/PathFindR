export const generateRoadmap = async (goal, knowledge, style) => {
    try {
        const response = await fetch('/api/generate-roadmap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ goal, knowledge, style }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected to match the structure from server/ai.js
    } catch (error) {
        console.error("Failed to generate roadmap via API:", error);
        // Fallback or rethrow? For now, let's rethrow so the UI shows an error or handles it
        throw error;
    }
};
