import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ reply: "Method not allowed" });
    }

    try {
        // 2. Validate API Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ reply: "Configuration error: API key missing." });
        }

        // 3. Process AI Request
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const { message } = req.body;
        const result = await model.generateContent(message);
        
        // 4. Return the AI response
        res.status(200).json({ reply: result.response.text() });
        
    } catch (error) {
        console.error("Backend Error Details:", error);
        res.status(500).json({ reply: "AI failed to respond. Please try again." });
    }
}
