# Role Play Practice — Intelligent Systems Engineering

AI-powered conversation practice for intelligent systems engineering students, styled with Indiana University branding. Students practice the conversations engineers actually have — requirements elicitation, defending design decisions, technical interviews, disagreeing with teammates — against an AI persona that stays in character, then get rubric-based coaching feedback.

**Live site:** https://akesha.github.io/scenario/

## How it works

1. **Describe or pick** — students either describe a conversation to practice (the AI builds a scenario) or pick from a curated bank of 24 scenarios across six categories, each with a persona, situation, opening line, and feedback rubric.
2. **Edit** — every scenario field is editable before starting.
3. **Role play** — a chat (typed or spoken) where the AI stays fully in character.
4. **Feedback** — a coaching review scored against the scenario's rubric, with quoted strengths, specific improvements, and a "try this instead" rewrite.

## Files

- `index.html` — the entire app (UI, scenario bank, API calls). No build step.
- `role-play-voice-worker.js` — Cloudflare Worker that proxies ElevenLabs text-to-speech so the API key stays server-side. Setup instructions are at the top of the file. Voice is optional; without it the app runs text-only.

The Anthropic API calls go through an existing Cloudflare Worker proxy (see `PROXY_URL` in `index.html`), which holds the API key as a Worker secret.

## Editing the scenario bank

All 24 scenarios live in the `SCENARIO_BANK` constant near the top of the `<script>` in `index.html`. Each entry is plain JSON-like JavaScript — add, remove, or edit scenarios there; no other changes needed.

## Privacy

Conversations are not stored anywhere — no accounts, no logging, no localStorage. Only the persona's AI-generated replies are sent to ElevenLabs for speech; student-typed text never goes there. The UI asks students not to include personal or grade information.
