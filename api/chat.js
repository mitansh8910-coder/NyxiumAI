// api/chat.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Simple in-memory tracker (replace with DB for production)
const userSearchCounts = {};
const MAX_SEARCHES = 5;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { userId, message } = req.body; // assume you pass userId from frontend

    // Initialize user count if not present
    if (!userSearchCounts[userId]) {
        userSearchCounts[userId] = { count: 0, date: new Date().toDateString() };
    }

    // Reset daily count if date changed
    if (userSearchCounts[userId].date !== new Date().toDateString()) {
        userSearchCounts[userId] = { count: 0, date: new Date().toDateString() };
    }

    // Enforce limit
    if (userSearchCounts[userId].count >= MAX_SEARCHES) {
        return res.status(429).json({ 
            error: "Daily search limit reached (5 per user). Try again tomorrow." 
        });
    }

    try {
        // Increment usage
        userSearchCounts[userId].count++;

        // Gemini call
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.5-flash", 
            systemInstruction: "You are Nyxium AI, a helpful assistant for Discord server management."
        });

        const result = await model.generateContent(message);
        const text = result.response.text();

        return res.status(200).json({ reply: text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: "Backend Error: " + error.message });
    }
}
