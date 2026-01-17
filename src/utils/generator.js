export const generateRoadmap = async (goal, knowledge, style) => {
    try {
        console.log("Frontend: Initiating API call to /api/generate-roadmap with:", { goal, knowledge, style }); // DEBUG LOG
        const response = await fetch('/api/generate-roadmap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ goal, knowledge, style }),
        });
        console.log("Frontend: Response received status:", response.status); // DEBUG LOG

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend Error Response:", errorText);
            try {
                const errorJson = JSON.parse(errorText);
                console.error("Backend Error Details:", errorJson);
            } catch (e) { /* ignore json parse error */ }

            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data; // Expected to match the structure from server/ai.js
    } catch (error) {
        console.error("Failed to generate roadmap via API:", error);
        // Fallback or rethrow? For now, let's rethrow so the UI shows an error or handles it
        throw error;
    }
};
