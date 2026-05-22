// api/chat.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Enable CORS to allow your website to talk to this API
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') return res.status(405).end();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    try {
        const { message } = req.body;
        const result = await model.generateContent(message);
        const response = await result.response;
        res.status(200).json({ reply: response.text() });
    } catch (error) {
        res.status(500).json({ error: "Failed to connect to Nyxium AI" });
    }
}
