import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API_KEY_NOT_SET");
        
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Use the current stable model
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        
        const { message } = req.body;
        if (!message) throw new Error("NO_MESSAGE_PROVIDED");
        
        // Instruct the model to use Markdown bullet points
        const prompt = `${message} \n\n(Please provide your response in Markdown, using bullet points for lists.)`;
        
        const result = await model.generateContent(prompt);
        res.status(200).json({ reply: result.response.text() });
        
    } catch (error) {
        console.error("DEBUG_ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
}
