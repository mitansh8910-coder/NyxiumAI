import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ reply: "Method Not Allowed" });
    }

    try {
        // 2. Ensure API Key exists
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("API Key is missing in Environment Variables");
            return res.status(500).json({ reply: "Server misconfiguration." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 3. Extract and process message
        const { message } = req.body;
        const result = await model.generateContent(message);
        const responseText = result.response.text();

        return res.status(200).json({ reply: responseText });
    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ reply: "AI failed to respond." });
    }
}
