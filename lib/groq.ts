// ============================================================
// Groq AI client — generates extra soal when online.
// Results are cached in Supabase + local storage for offline.
// ============================================================
import type { Difficulty, GameType, Language } from '@/types';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export const isGroqConfigured = Boolean(GROQ_API_KEY);

function buildPrompt(
  gameType: GameType,
  language: Language,
  difficulty: Difficulty,
  count: number
): string {
  const lang = language === 'id' ? 'Indonesian' : 'English';

  switch (gameType) {
    case 'logic':
      return `Generate ${count} multiple-choice logic puzzle questions in ${lang}, difficulty ${difficulty}.
Return ONLY valid JSON: { "questions": [ { "id": string, "question": string, "options": [string,string,string,string], "answer": number (0-3 index), "explanation": string } ] }`;

    case 'crossword':
      return `Generate 1 crossword puzzle in ${lang}, difficulty ${difficulty}.
Return ONLY valid JSON: { "puzzles": [ { "id": string, "size": number, "grid": string[][], "clues": { "across": [{ "number": number, "clue": string, "answer": string, "row": number, "col": number }], "down": [{ "number": number, "clue": string, "answer": string, "row": number, "col": number }] } } ] }`;

    case 'word':
      return `Generate ${count} word-search themes in ${lang}, difficulty ${difficulty}.
Return ONLY valid JSON: { "puzzles": [ { "id": string, "theme": string, "words": string[] } ] }`;

    case 'memory':
      return `Generate ${count} memory card sets in ${lang}, difficulty ${difficulty}.
Return ONLY valid JSON: { "sets": [ { "id": string, "theme": string, "pairs": [[string,string]] } ] }`;

    case 'math':
    default:
      return `Generate ${count} mental-math questions, difficulty ${difficulty}.
Return ONLY valid JSON: { "questions": [ { "id": string, "expression": string, "answer": number } ] }`;
  }
}

export async function generateSoalFromGroq(
  gameType: GameType,
  language: Language,
  difficulty: Difficulty,
  count = 10
): Promise<unknown | null> {
  if (!isGroqConfigured) return null;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildPrompt(gameType, language, difficulty, count) }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch {
    return null;
  }
}
