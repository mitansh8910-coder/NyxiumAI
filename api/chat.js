import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Force JSON response even on errors
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "Configuration Error: GEMINI_API_KEY missing in Vercel Settings" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(message);
        return res.status(200).json({ reply: result.response.text() });
        
    } catch (error) {
        // This will now show the REAL error in your chat bubble instead of 'Unexpected token T'
        return res.status(500).json({ error: "Backend Error: " + error.message });
    }
}
