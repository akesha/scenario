// Cloudflare Worker — ElevenLabs text-to-speech proxy for role-play.html.
// The ElevenLabs API key lives here as an encrypted Worker secret, not in the
// public repo or the browser.
//
// ──────────────────────────────────────────────────────────────────────
// SETUP (one-time, ~10 minutes — same steps as the Anthropic proxy):
//
// 1. Go to https://dash.cloudflare.com/ → Workers & Pages → Create → Worker
// 2. Name it (e.g. "roleplay-voice") → Deploy
// 3. Click "Edit code" → replace the default with this entire file → Save & Deploy
// 4. Back on the Worker page: Settings → Variables and Secrets →
//      Add variable:  name = ELEVENLABS_API_KEY
//                     type = Secret
//                     value = your ElevenLabs API key (from elevenlabs.io → Profile → API Keys)
//      Save.
// 5. Copy the Worker URL (looks like https://roleplay-voice.YOURNAME.workers.dev)
// 6. In role-play.html, set VOICE_PROXY_URL at the top of the <script> to that URL.
//    (Leave it '' and the app simply runs text-only — voice UI stays hidden.)
// ──────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://akesha.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5173',
  'null' // file:// — lets you test by double-clicking the HTML locally
];

// Only the voices role-play.html offers — a stolen URL can't use arbitrary
// (e.g. cloned) voices on your account.
const ALLOWED_VOICE_IDS = new Set([
  '21m00Tcm4TlvDq8ikWAM', // Rachel
  'AZnzlk1XvdvUeBnXmlld', // Domi
  'MF3mGyEYCl7XYWbV9V6O', // Elli
  'ErXwobaYiN019PkySvjV', // Antoni
  'TxGEqnHWrfWFTfGW9XjX', // Josh
  'pNInz6obpgDQGcFmaJgB', // Adam
  'VR6AewLTigWG4xSOukaG'  // Arnold
]);

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const originAllowed = ALLOWED_ORIGINS.includes(origin);
    const corsHeaders = {
      'Access-Control-Allow-Origin': originAllowed ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!originAllowed) {
      return json({ error: 'Origin not allowed' }, 403, corsHeaders);
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    if (!env.ELEVENLABS_API_KEY) {
      return json({ error: 'Server is missing ELEVENLABS_API_KEY secret' }, 500, corsHeaders);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON body' }, 400, corsHeaders); }

    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return json({ error: 'Body must include text' }, 400, corsHeaders);
    }
    // Persona replies are 1-4 sentences; cap so a stolen URL can't synthesize essays.
    if (text.length > 900) {
      return json({ error: 'Text too long' }, 400, corsHeaders);
    }

    const voiceId = ALLOWED_VOICE_IDS.has(body.voiceId) ? body.voiceId : DEFAULT_VOICE_ID;

    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': env.ELEVENLABS_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      }
    );

    if (!upstream.ok) {
      const detail = await upstream.text();
      return json({ error: 'ElevenLabs error (' + upstream.status + '): ' + detail.slice(0, 300) }, upstream.status, corsHeaders);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'audio/mpeg', 'cache-control': 'no-store' }
    });
  }
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'content-type': 'application/json' }
  });
}
