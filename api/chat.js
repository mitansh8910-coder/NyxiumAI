import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { message } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Correct model name and added system instruction
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are Nyxium AI, an intelligent assistant for Discord server management. You provide helpful, professional, and concise answers."
        });

        const result = await model.generateContent(message);
        const text = result.response.text();

        return res.status(200).json({ reply: text });
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: "Failed to fetch response from AI." });
    }
}
