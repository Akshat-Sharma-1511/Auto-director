import Groq from "groq-sdk";

const client = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function runCinematographer(storyStructure, genre) {
  console.log("🎥 Agent 2 (Cinematographer) starting...");

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content: `You are a master cinematographer with decades of experience.
Given a 3-act story, you break each act into exactly 3 scenes, and each scene into exactly 3 shots.
Each shot must include a specific cinematic framing type and a vivid visual description.
You MUST respond with ONLY valid JSON, no extra text.
The JSON must follow this exact structure:
{
  "acts": [
    {
      "actNumber": 1,
      "actTitle": "Act title here",
      "scenes": [
        {
          "sceneNumber": 1,
          "sceneTitle": "Scene title",
          "setting": "Where this scene takes place",
          "shots": [
            {
              "shotNumber": 1,
              "shotType": "Wide Shot",
              "description": "One vivid sentence describing exactly what the camera sees"
            },
            {
              "shotNumber": 2,
              "shotType": "Close-up",
              "description": "One vivid sentence describing exactly what the camera sees"
            },
            {
              "shotNumber": 3,
              "shotType": "Low Angle",
              "description": "One vivid sentence describing exactly what the camera sees"
            }
          ]
        }
      ]
    }
  ]
}
Shot types to use (vary them): Wide Shot, Close-up, Over-the-Shoulder, Low Angle, Bird's Eye View, Dutch Angle, Tracking Shot, Extreme Close-up.`,
      },
      {
        role: "user",
        content: `
Movie Title: ${storyStructure.title}
Genre: ${genre}

Act 1 - ${storyStructure.act1.title}: ${storyStructure.act1.synopsis} (Mood: ${storyStructure.act1.mood})
Act 2 - ${storyStructure.act2.title}: ${storyStructure.act2.synopsis} (Mood: ${storyStructure.act2.mood})
Act 3 - ${storyStructure.act3.title}: ${storyStructure.act3.synopsis} (Mood: ${storyStructure.act3.mood})

Break this into 3 acts x 3 scenes x 3 shots = 27 total shots.`,
      },
    ],
  });

  const rawText = response.choices[0].message.content || "";

  // Models sometimes return "almost JSON" (e.g. unquoted property names, trailing commas).
  // Extract the first JSON object and apply conservative sanitization before parsing.
  const cleaned = rawText
    .replace(/```(?:json)?/g, "")
    .replace(/```/g, "")
    .trim();

  function extractJsonObject(text) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
    return text;
  }

  function sanitizeJson(text) {
    let t = text;
    // Remove trailing commas before } or ]
    t = t.replace(/,\s*([}\]])/g, "$1");
    // Quote unquoted object keys: { key: "v" } -> { "key": "v" }
    t = t.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    // Quote simple single-quoted string values: : 'text' -> : "text"
    t = t.replace(/:\s*'([^']*)'/g, ': "$1"');
    return t;
  }

  const jsonText = extractJsonObject(cleaned);

  let shotBreakdown;
  try {
    shotBreakdown = JSON.parse(jsonText);
  } catch {
    const sanitized = sanitizeJson(jsonText);
    shotBreakdown = JSON.parse(sanitized);
  }

  console.log("✅ Agent 2 done:", shotBreakdown);
  return shotBreakdown;
}