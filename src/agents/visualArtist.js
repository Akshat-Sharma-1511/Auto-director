/**
 * Visual Artist Agent
 * Generates AI images using Hugging Face Router API (FLUX.1-schnell model).
 * Free — just needs a Hugging Face access token.
 *
 * Get your free token at: https://huggingface.co/settings/tokens
 */

const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
const HF_MODEL = "black-forest-labs/FLUX.1-schnell";

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashSeed(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildImagePrompt(shot, genre) {
  const parts = [
    shot.description || shot.visualDescription,
    shot.setting || shot.location,
    shot.timeOfDay,
    shot.mood,
    shot.shotType && `${shot.shotType} shot`,
    genre && `${genre} film`,
    "cinematic, film still, high quality",
  ];

  return parts
    .filter(Boolean)
    .map((p) => String(p).replace(/[.,!?;]+$/, "").trim())
    .join(", ");
}

function buildFallbackUrl(shot, genre, movieTitle) {
  const seed = hashSeed(
    [movieTitle, genre, shot.shotType, shot.shotNumber]
      .filter(Boolean)
      .join("|")
  );
  return `https://picsum.photos/seed/${seed}/768/432`;
}

async function generateHFImage(prompt, shot) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(
      `/hf-api/models/${HF_MODEL}`,  // proxied through Vite → router.huggingface.co
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 768,
            height: 432,
            seed: hashSeed([shot.shotNumber, shot.shotType, prompt].join("|")),
            num_inference_steps: 4,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));

      // Model is loading — wait and retry once
      if (res.status === 503 && err?.estimated_time) {
        console.warn(
          `  ⏳ Model loading, waiting ${Math.ceil(err.estimated_time)}s for shot ${shot.shotNumber}...`
        );
        await new Promise((r) =>
          setTimeout(r, Math.min(err.estimated_time * 1000, 20000))
        );
        return generateHFImage(prompt, shot);
      }

      console.warn(`  ⚠️ HF returned ${res.status} for shot ${shot.shotNumber}:`, err);
      return null;
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    console.log(`  ✅ Generated image for shot ${shot.shotNumber}`);
    return objectUrl;
  } catch (err) {
    console.warn(`  ⚠️ HF generation failed (${err.message}) for shot ${shot.shotNumber}`);
    return null;
  }
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function attachImagesToShots(shots, genre, movieTitle) {
  console.log("🎨 Agent 3 (Visual Artist) starting...");

  if (!HF_API_KEY) {
    throw new Error(
      "Missing VITE_HF_API_KEY. Add it to your .env file. Get one free at https://huggingface.co/settings/tokens"
    );
  }

  const flatShots = shots.acts.flatMap((act) =>
    act.scenes.flatMap((scene) => scene.shots)
  );

  console.log(`  Processing ${flatShots.length} shots...`);

  const results = [];

  for (let i = 0; i < flatShots.length; i++) {
    const shot = flatShots[i];
    const prompt = buildImagePrompt(shot, genre);
    const fallbackImageUrl = buildFallbackUrl(shot, genre, movieTitle);

    console.log(`  [${i + 1}/${flatShots.length}] "${prompt.slice(0, 60)}..."`);

    const hfUrl = await generateHFImage(prompt, shot);

    results.push({
      shot,
      imageUrl: hfUrl ?? fallbackImageUrl,
      fallbackImageUrl,
      imagePrompt: prompt,
      imageIndex: i,
      usedFallback: !hfUrl,
    });
  }

  const enrichmentMap = new Map(results.map((r) => [r.shot, r]));

  const enriched = {
    ...shots,
    acts: shots.acts.map((act) => ({
      ...act,
      scenes: act.scenes.map((scene) => ({
        ...scene,
        shots: scene.shots.map((shot) => {
          const { imageUrl, fallbackImageUrl, imagePrompt, imageIndex, usedFallback } =
            enrichmentMap.get(shot);
          return {
            ...shot,
            imageUrl,
            fallbackImageUrl,
            imagePrompt,
            imageIndex,
            usedFallback,
          };
        }),
      })),
    })),
  };

  const fallbackCount = results.filter((r) => r.usedFallback).length;
  const sample = enriched?.acts?.[0]?.scenes?.[0]?.shots?.[0];

  console.log("✅ Agent 3 done:", {
    totalShots: flatShots.length,
    generatedOk: flatShots.length - fallbackCount,
    usedFallback: fallbackCount,
    samplePrompt: sample?.imagePrompt,
    sampleUrl: sample?.imageUrl,
  });

  return enriched;
}