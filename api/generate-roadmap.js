import { generateRoadmapAI } from '../server/ai.js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { goal, knowledge, style } = req.body;

        if (!goal) {
            return res.status(400).json({ error: 'Goal is required' });
        }

        console.log(`Generating roadmap regarding: ${goal}, Level: ${knowledge}, Style: ${style}`);

        // Call AI module
        const roadmap = await generateRoadmapAI(goal, knowledge, style);

        res.status(200).json(roadmap);
    } catch (error) {
        console.error('Error generating roadmap:', error);
        res.status(500).json({ error: 'Failed to generate roadmap', details: error.message });
    }
}
