import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

app.use(express.json({ limit: '32kb' }));

const allowedActivities = new Set(['walking', 'hiking', 'gardening', 'birdwatching']);
const allowedExperience = new Set(['beginner', 'intermediate']);
const allowedTimes = new Set(['15', '30', '60', '120']);

function cleanStringArray(value, maxItems = 8) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, maxItems);
}

function parseModelJson(content) {
  const trimmed = String(content || '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Some local models wrap JSON in a Markdown code fence despite instructions.
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match) return JSON.parse(match[1].trim());
    throw new Error('The model did not return valid JSON. Please try again.');
  }
}

function validatePlan(plan) {
  const requiredText = ['title', 'intro', 'location', 'levelNote'];
  for (const key of requiredText) {
    if (typeof plan?.[key] !== 'string' || !plan[key].trim()) {
      throw new Error(`The model response is missing "${key}". Please try again.`);
    }
  }
  for (const key of ['prep', 'checklist', 'safety', 'schedule']) {
    if (!Array.isArray(plan?.[key]) || plan[key].length === 0 ||
        !plan[key].every((item) => typeof item === 'string')) {
      throw new Error(`The model response has an invalid "${key}" list. Please try again.`);
    }
  }
  return {
    title: plan.title.slice(0, 140),
    intro: plan.intro.slice(0, 500),
    location: plan.location.slice(0, 220),
    levelNote: plan.levelNote.slice(0, 500),
    duration: plan.duration,
    prep: plan.prep.slice(0, 6).map((item) => item.slice(0, 220)),
    checklist: plan.checklist.slice(0, 8).map((item) => item.slice(0, 220)),
    safety: plan.safety.slice(0, 8).map((item) => item.slice(0, 220)),
    schedule: plan.schedule.slice(0, 6).map((item) => item.slice(0, 220)),
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: OLLAMA_MODEL });
});

app.post('/api/plan', async (req, res) => {
  const { activity, time, experienceLevel, interests } = req.body ?? {};

  if (!allowedActivities.has(activity)) {
    return res.status(400).json({ error: 'Choose a valid outdoor activity.' });
  }
  if (!allowedTimes.has(String(time))) {
    return res.status(400).json({ error: 'Choose a valid available time.' });
  }
  if (!allowedExperience.has(experienceLevel)) {
    return res.status(400).json({ error: 'Choose beginner or intermediate experience.' });
  }

  const safeInterests = cleanStringArray(interests);
  const durationLabel = String(time) === '120' ? '2+ hours' : String(time) === '60' ? '1 hour' : `${time} minutes`;

  const systemPrompt = `
You are TrailMate, a practical outdoor activity planning assistant.
Return ONLY a valid JSON object, with no Markdown or surrounding commentary, using exactly these keys:
{
  "title": "short plan title",
  "intro": "friendly 1-2 sentence overview",
  "duration": "duration label",
  "location": "general type of place, not a specific claimed venue",
  "levelNote": "encouraging advice tailored to the experience level",
  "prep": ["3-5 preparation steps"],
  "checklist": ["4-6 practical activity steps"],
  "safety": ["3-5 sensible safety tips"],
  "schedule": ["time block and activity", "time block and activity", "time block and activity"]
}
Rules:
- Be realistic for the time and experience level provided.
- Treat user interests as preferences, not as verified facts.
- Do not invent current weather, trail conditions, exact routes, distances, opening hours, local venues, wildlife sightings, or real-time information.
- If conditions matter, tell the user to check them from a reliable local source before leaving.
- Give general location suggestions only, such as "a nearby public park or marked trail".
- Do not give medical advice. Encourage the user to stop if they feel unwell or unsafe.
- Keep wording concise, useful, inclusive, and beginner-friendly.
- The duration field must be "${durationLabel}".
`;

  const userPrompt = JSON.stringify({
    activity,
    availableTime: durationLabel,
    experienceLevel,
    interests: safeInterests,
  });

  try {
    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        options: { temperature: 0.6 },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!ollamaResponse.ok) {
      const detail = await ollamaResponse.text().catch(() => '');
      console.error(`Ollama returned ${ollamaResponse.status}: ${detail.slice(0, 500)}`);
      return res.status(502).json({
        error: `Ollama returned an error (${ollamaResponse.status}). Check that the model is available and try again.`,
      });
    }

    const ollamaData = await ollamaResponse.json();
    const parsed = parseModelJson(ollamaData?.message?.content);
    const plan = validatePlan({ ...parsed, duration: durationLabel });
    return res.json({ plan, model: OLLAMA_MODEL });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return res.status(504).json({ error: 'Ollama took too long to respond. Please try again.' });
    }
    if (error?.cause?.code === 'ECONNREFUSED' || /fetch failed/i.test(error?.message || '')) {
      return res.status(503).json({
        error: `Cannot connect to Ollama at ${OLLAMA_URL}. Start Ollama and confirm the ${OLLAMA_MODEL} model is installed.`,
      });
    }
    console.error('Plan generation failed:', error?.message || error);
    return res.status(502).json({ error: error?.message || 'Could not generate a plan. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`TrailMate API listening at http://localhost:${PORT}`);
  console.log(`Using Ollama model: ${OLLAMA_MODEL}`);
});
