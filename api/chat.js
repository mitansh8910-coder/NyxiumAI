import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key is not configured in Vercel settings.");
        
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Try this specific version string for universal support
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        
        const { message } = req.body;
        const result = await model.generateContent(message);
        
        res.status(200).json({ reply: result.response.text() });
    } catch (error) {
        console.error("DEBUG:", error);
        res.status(500).json({ error: error.message });
    }
}
