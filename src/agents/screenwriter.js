import Groq from "groq-sdk";

const client = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function runScreenwriter(userPrompt, genre) {
  console.log("🎬 Agent 1 (Screenwriter) starting...");

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content: `You are an award-winning Hollywood screenwriter.
Your job is to take a one-line story idea and expand it into a structured 3-act narrative.
You MUST respond with ONLY valid JSON, no extra text before or after.
The JSON must follow this exact structure:
{
  "title": "The movie title",
  "genre": "the genre",
  "act1": {
    "title": "Act 1 title",
    "synopsis": "2 sentences describing what happens",
    "mood": "the emotional tone (e.g. tense, mysterious, hopeful)"
  },
  "act2": {
    "title": "Act 2 title",
    "synopsis": "2 sentences describing what happens",
    "mood": "the emotional tone"
  },
  "act3": {
    "title": "Act 3 title",
    "synopsis": "2 sentences describing what happens",
    "mood": "the emotional tone"
  }
}`,
      },
      {
        role: "user",
        content: `Story idea: "${userPrompt}"\nGenre: ${genre}\nWrite the 3-act structure for this story.`,
      },
    ],
  });

  const rawText = response.choices[0].message.content || "";
  const cleaned = rawText.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();

  function extractJsonObject(text) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
    return text;
  }

  function sanitizeJson(text) {
    let t = text;
    t = t.replace(/,\s*([}\]])/g, "$1");
    t = t.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    t = t.replace(/:\s*'([^']*)'/g, ': "$1"');
    return t;
  }

  const jsonText = extractJsonObject(cleaned);
  let storyStructure;
  try {
    storyStructure = JSON.parse(jsonText);
  } catch {
    storyStructure = JSON.parse(sanitizeJson(jsonText));
  }

  console.log("✅ Agent 1 done:", storyStructure);
  return storyStructure;
}