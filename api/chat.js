/**
 * Local Fallback Intelligence (Invoked if Gemini API fails or is exhausted)
 */
function getFallbackResponse(message) {
  const msg = message.toLowerCase();
  
  // 1. Math Engine (Basic arithmetic fallback)
  const mathMatch = msg.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const b = parseFloat(mathMatch[3]);
    let result;
    switch(op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b !== 0 ? a / b : "division by zero"; break;
    }
    return `[HAPPY] Huh... seriously? You're making me do basic math? It's ${result}. Next time use a calculator, okay?`;
  }

  // 2. Personality-based General Knowledge Fallback
  if (msg.includes("who are you") || msg.includes("name")) {
    return "[NEUTRAL] I'm Nyxium. If you're talking to me while the API is down, it means I'm running in local-fallback mode. I'm just as sharp, but a bit more limited.";
  }
  
  // General fallback for any other query
  return "[NEUTRAL] Honestly, my main brain is currently offline. I can only handle simple calculations or basic inquiries right now. Try me again in a bit.";
}

export default async function handler(req, res) {
  // 1. Enforce POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  // 2. Input Validation
  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message content is required." });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    // 3. API Request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: "You are Nyxium, a sharp, blunt human chatting casually. [EMOTION] format required." }]
          },
          contents: [{ role: "user", parts: [{ text: message }] }]
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    // If API fails or returns error status, return the fallback reply
    if (!response.ok) {
      return res.status(200).json({ reply: getFallbackResponse(message) });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // If response is malformed, return fallback
    if (!reply) {
      return res.status(200).json({ reply: getFallbackResponse(message) });
    }

    res.status(200).json({ reply });

  } catch (err) {
    console.error("Nyxium Backend Error:", err);
    // On any internal error (including timeout or fetch failure), send fallback
    res.status(200).json({ reply: getFallbackResponse(message) });
  }
}
