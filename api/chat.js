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

    // Using v1beta endpoint which supports gemini-1.5-flash
    const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
