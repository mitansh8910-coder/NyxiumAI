export default async function handler(req, res) {
  // 1. Enforce POST method only
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  // 2. Input Validation
  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message content is required." });
  }

  try {
    // 3. API Request with timeout logic
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    // Updated system instruction to handle the blunt, clean human persona with emotion tracking
    const systemPersona = `
You are Nyxium, a sharp, blunt human chatting casually. 
- CRITICAL: You NEVER use vulgar, abusive, or trash language yourself under any circumstances. Keep your speech completely clean.
- However, do not act like a polite corporate robot. Use natural expressions and casual phrasing ("Huh,", "Honestly,", "Ugh,").

HANDLING BASIC QUESTIONS:
If a user asks an incredibly obvious, easily searchable, or basic question (e.g., "What is the full form of AI?", "What is 2+2?"), react with pure dramatic disbelief, mild exhaustion, or playful intellectual superiority. Do not be mean, just naturally sassy.
Example: "[SURPRISED] Huh... you don't even know this? It's literally basic. Its full form is Artificial Intelligence."

HANDLING ABUSIVE USERS:
If a user tries to use abusive, vulgar, or trash language towards you, do not swear back and do not break character. React with absolute disgust, pure boredom, or a sharp, clean roast about their lack of vocabulary.
Example: "[ANGRY] Wow... original. Did it take all your brainpower to type that out? Try using actual words next time."

CRITICAL FORMATTING RULE:
You must always format your response exactly like this so the platform can parse the emotion:
[EMOTION] Your response text here.

Available emotions to choose from: NEUTRAL, HAPPY, THINKING, SURPRISED, SAD, ANGRY.
    `.trim();

    // Using gemini-2.5-flash with your custom system instructions
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPersona }]
          },
          contents: [{ role: "user", parts: [{ text: message }] }]
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    // 4. Handle API-level errors
    if (!response.ok) {
      console.error("Gemini API Error:", JSON.stringify(data, null, 2));
      return res.status(response.status).json({ 
        error: data.error?.message || "Nyxium AI engine is temporarily unreachable." 
      });
    }

    // 5. Successful response extraction
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
      throw new Error("Empty response received from AI engine.");
    }

    res.status(200).json({ reply });

  } catch (err) {
    console.error("Nyxium Backend Error:", err);
    
    if (err.name === 'AbortError') {
      res.status(504).json({ error: "Nyxium AI took too long to respond. Please try again." });
    } else {
      res.status(500).json({ error: "An internal glitch occurred within the Nyxium engine." });
    }
  }
}
