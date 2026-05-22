import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        // THIS MUST MATCH THE NAME IN VERCEL SETTINGS
        const apiKey = process.env.GEMINI_API_KEY; 
        
        if (!apiKey) {
            console.error("API Key missing!");
            return res.status(500).json({ reply: "Configuration error." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const { message } = req.body;
        const result = await model.generateContent(message);
        
        res.status(200).json({ reply: result.response.text() });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ reply: "AI failed to respond. Please try again." });
    }
}
