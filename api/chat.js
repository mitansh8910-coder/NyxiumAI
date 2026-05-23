import { GoogleGenerativeAI } from "@google/generative-ai";

// OpenAI fallback
async function openaiText(message) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini", // lightweight GPT‑4 model
            messages: [
                { role: "system", content: "You are Nyxium AI, a helpful assistant for Discord server management." },
                { role: "user", content: message }
            ]
        })
    });

    if (!res.ok) throw new Error("OpenAI request failed");
    const data = await res.json();
    return data.choices[0].message.content;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { message } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.5-flash", 
            systemInstruction: "You are Nyxium AI, a helpful assistant for Discord server management."
        });

        // Try Gemini first
        const result = await model.generateContent(message);
        const text = result.response.text();

        return res.status(200).json({ reply: text });
    } catch (error) {
        console.error("Gemini API Error, switching to OpenAI:", error);

        try {
            const text = await openaiText(req.body.message);
            return res.status(200).json({ reply: text });
        } catch (err) {
            console.error("OpenAI API Error:", err);
            return res.status(500).json({ error: "Backend Error: " + err.message });
        }
    }
}
