import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || '*'
}));

app.use(express.json());

// Auth Middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const apiKey = process.env.API_KEY;

    if (apiKey && apiKey.trim() !== '') {
        if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }
    next();
};

const openai = new OpenAI({
    baseURL: process.env.LLM_BASE_URL,
    apiKey: process.env.LLM_API_KEY,
});

app.post('/api/chat', authMiddleware, async (req, res) => {
    try {
        const { messages } = req.body;

        const completion = await openai.chat.completions.create({
            messages: messages || [],
            model: process.env.LLM_MODEL,
            stream: true,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                res.write(content); // Simple streaming for demo
            }
        }
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
