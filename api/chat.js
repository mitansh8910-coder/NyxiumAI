import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Use gemini-1.0-pro instead
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        
        const { message } = req.body;
        const result = await model.generateContent(message);
        
        res.status(200).json({ reply: result.response.text() });
    } catch (error) {
        console.error("Critical Error:", error);
        res.status(500).json({ reply: "AI Error: " + error.message });
    }
}
