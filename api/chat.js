import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API_KEY_NOT_SET");
        
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // To this (The current stable model):
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "You are Nyxium AI, a helpful assistant for Discord servers." 
});
        
        const { message } = req.body;
        if (!message) throw new Error("NO_MESSAGE_PROVIDED");
        
        // Instruct the model to use Markdown bullet points
        const prompt = `${message} \n\n(Please provide your response in Markdown, using bullet points for lists.)`;
        
        const result = await model.generateContent(prompt);
        res.status(200).json({ reply: result.response.text() });
        
        // Instead of directly setting .innerHTML to data.reply, use marked.parse():
const htmlReply = marked.parse(data.reply);

// Now display the parsed HTML
chatBox.innerHTML += `<div><b>Nyxium AI:</b> ${htmlReply}</div>`;
        
    } catch (error) {
        console.error("DEBUG_ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
}
