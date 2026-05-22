import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Only allow POST requests for this test
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key missing");
        
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // This command queries the Google API for models YOUR key can use
        const models = await genAI.listModels();
        
        // Respond with the list so we can see it
        res.status(200).json({ available: models });
    } catch (error) {
        console.error("Diagnostic Error:", error);
        res.status(500).json({ error: error.message });
    }
}
