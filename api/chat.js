// Change your api/chat.js to look like this:
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { message } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // UPDATE THIS LINE to the new model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.5-flash", 
            systemInstruction: "You are Nyxium AI, a helpful assistant for Discord server management."
        });

        const result = await model.generateContent(message);
        const text = result.response.text();

        return res.status(200).json({ reply: text });
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: "Backend Error: " + error.message });
    }
}
async function sendMessage() {
    const btn = document.getElementById('send-btn');
    btn.disabled = true;
    btn.innerText = "Thinking..."; // Provide feedback
    
    // ... your fetch code ...
    
    btn.disabled = false;
    btn.innerText = "Send";
}

document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
