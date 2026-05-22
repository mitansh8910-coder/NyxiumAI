import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // This command asks Google: "What models can I use?"
        const models = await genAI.listModels();
        
        res.status(200).json({ availableModels: models });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
