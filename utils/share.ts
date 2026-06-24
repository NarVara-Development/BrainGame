import { Share } from 'react-native';
import type { Language } from '@/types';

const APP_LINK = 'https://play.google.com/store/apps/details?id=com.narvara.braingame';

/** Opens the OS share sheet → WhatsApp, Facebook, Instagram, TikTok, etc. */
export async function shareText(message: string) {
  try {
    await Share.share({ message });
  } catch {
    /* user dismissed */
  }
}

/** Share a game result to any social app. */
export function shareResult(score: number, lang: Language) {
  const msg =
    lang === 'id'
      ? `🧠 Aku dapat ${score.toLocaleString()} poin di NarVara BrainGame! Bisa kalahin aku? 🔥\nMain di sini: ${APP_LINK}`
      : `🧠 I scored ${score.toLocaleString()} on NarVara BrainGame! Can you beat me? 🔥\nPlay here: ${APP_LINK}`;
  return shareText(msg);
}
