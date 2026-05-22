import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // CHANGE THE MODEL NAME TO THIS EXACT STRING
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const { message } = req.body;
        const result = await model.generateContent(message);
        
        res.status(200).json({ reply: result.response.text() });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ reply: "AI Error: " + error.message });
    }
}
