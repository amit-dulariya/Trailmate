<<<<<<< HEAD
# TrailMate AI — Ollama local AI integration

TrailMate AI uses a React + Vite frontend and a Node.js + Express backend. The backend sends requests to Ollama's local `/api/chat` endpoint using `llama3.2:3b`. The browser never calls Ollama directly.

## Requirements

- Windows 10/11
- Node.js 18 or newer (Node 20+ recommended; native `fetch` is used)
- Ollama for Windows
- The `llama3.2:3b` model downloaded locally

## 1. Install / verify Ollama

Open PowerShell:

```powershell
ollama --version
ollama pull llama3.2:3b
ollama list
```

Make sure `llama3.2:3b` appears in the list. Ollama normally listens on `http://localhost:11434`. Start the Ollama app if it is not already running.

Optional direct model test:

```powershell
ollama run llama3.2:3b
```

Type a short prompt, then enter `/bye` to exit.

## 2. Install project dependencies

Extract the project ZIP, open PowerShell in the extracted `trailmate-ai-ollama` folder (the folder containing `package.json`), then run:

```powershell
npm install
```

## 3. Start the backend

In PowerShell terminal 1:

```powershell
npm run server
```

Expected log:

```text
TrailMate API listening at http://localhost:3001
Using Ollama model: llama3.2:3b
```

Keep this terminal open.

## 4. Start the frontend

Open a second PowerShell terminal in the same project folder:

```powershell
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

Vite proxies `/api/*` requests to Express on port 3001, so the frontend does not need a hard-coded backend URL.

## 5. Test the backend in PowerShell

With the backend running, open a third PowerShell terminal:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get
```

Expected result includes `ok: True` and `model: llama3.2:3b`.

Test plan generation directly:

```powershell
$body = @{
  activity = "walking"
  time = "30"
  experienceLevel = "beginner"
  interests = @("Peace and mindfulness", "Birds and wildlife")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/plan" -Method Post -ContentType "application/json" -Body $body
```

The response should contain a `plan` object with `title`, `intro`, `duration`, `location`, `levelNote`, `prep`, `checklist`, `safety`, and `schedule`.

## 6. Test in the browser

1. Open the Vite frontend.
2. Select an activity, time, experience level, and any interests.
3. Click **Generate my plan**.
4. The button shows a loading state while Ollama responds.
5. On success, the generated plan appears with preparation steps, a checklist, time outline, and safety tips.
6. Stop Ollama or the backend and try again to verify the error state.

## Common Windows troubleshooting

### `Cannot connect to Ollama`

- Open the Ollama desktop app.
- In PowerShell, run `ollama list`.
- Check `http://localhost:11434` is reachable. The Ollama API may not return a friendly webpage at `/`; the important test is whether the chat endpoint works.
- If Ollama is using a different host, set `OLLAMA_URL` before starting the backend:

```powershell
$env:OLLAMA_URL = "http://127.0.0.1:11434"
npm run server
```

### Model not found

```powershell
ollama pull llama3.2:3b
ollama list
```

### Port 3001 is already in use

Use another backend port and update the Vite proxy target in `vite.config.js` to match. For example, set `$env:PORT = "3002"` and change the proxy target to `http://localhost:3002`.

### Check production compilation

```powershell
npm run build
```

## API contract

`POST /api/plan`

Request:

```json
{
  "activity": "walking",
  "time": "30",
  "experienceLevel": "beginner",
  "interests": ["Peace and mindfulness"]
}
```

Response:

```json
{
  "plan": {
    "title": "A mindful outdoor break",
    "intro": "A concise overview.",
    "duration": "30 minutes",
    "location": "A nearby public park or quiet path",
    "levelNote": "Keep the pace gentle and take breaks when needed.",
    "prep": ["Bring water"],
    "checklist": ["Start at a comfortable pace"],
    "safety": ["Check local conditions before leaving"],
    "schedule": ["5 min · Prepare", "20 min · Explore", "5 min · Wind down"]
  },
  "model": "llama3.2:3b"
}
```

The response above is only an example shape, not live model output.

## Safety and privacy notes

- The browser calls only the Express `/api/plan` endpoint.
- Express calls `http://127.0.0.1:11434/api/chat` by default.
- No API key or cloud secret is required for local Ollama.
- The prompt instructs the model not to invent live weather, exact routes, distances, venues, opening hours, or wildlife sightings. The app uses general location suggestions only.
- AI output can still be imperfect; check local conditions and use judgment before outdoor activities.


## Nearby outdoor map

TrailMate now includes an additive Leaflet map using OpenStreetMap tiles and OpenStreetMap/Overpass place data. The browser requests geolocation only after the user presses **Use My Location**. The user's coordinates are never hardcoded.

- Verified mapped places are fetched from OpenStreetMap-compatible Overpass endpoints and labeled as verified mapped data.
- The map supports parks, gardens, hiking routes, walking paths/areas, natural areas, and picnic sites when those objects are mapped in OSM.
- Ollama-generated plans remain separate. The Ollama prompt explicitly forbids inventing exact venues or real-time location data, and AI suggestions are not rendered as map markers.
- Denying location permission does not break the planner.
- Live place discovery requires internet access. When offline, the map may still show browser-cached tiles if available, but TrailMate does not fabricate or reuse uncached place data.
- No Google Maps API key is used.

### Map testing

1. Start Ollama and the backend as described above, then run `npm run dev`.
2. Open the Vite URL in a desktop browser or a mobile browser on HTTPS/localhost.
3. Press **Use My Location** and allow location access. The map should center on the returned coordinates and query nearby OSM data.
4. Reset the browser's site location permission to **Block** and press the button again. The app should show a friendly permission message while the planner remains usable.
5. Turn off the network. The map shows an Offline state and nearby-place discovery is disabled. Any map tiles visible are only those already cached by the browser; no live location data is invented.
=======
# Trailmate
a sort outdoor visiting plan app
>>>>>>> ba34441be6d8a83f5bdb00735b1a27c59dc9edb3
