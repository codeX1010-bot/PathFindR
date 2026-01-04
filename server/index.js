import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateRoadmapAI } from './ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/generate-roadmap', async (req, res) => {
    try {
        const { goal, knowledge, style } = req.body;

        if (!goal) {
            return res.status(400).json({ error: 'Goal is required' });
        }

        console.log(`Generating roadmap regarding: ${goal}, Level: ${knowledge}, Style: ${style}`);

        // Call AI module
        const roadmap = await generateRoadmapAI(goal, knowledge, style);

        res.json(roadmap);
    } catch (error) {
        console.error('Error generating roadmap:', error);
        res.status(500).json({ error: 'Failed to generate roadmap', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
