import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ reply: "Method not allowed" });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ reply: "Server error: API Key missing" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const { message } = req.body;
        const result = await model.generateContent(message);
        const responseText = result.response.text();
        
        res.status(200).json({ reply: responseText });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "AI failed to respond. Check server logs." });
    }
}
