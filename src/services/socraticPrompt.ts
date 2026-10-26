import { SOCRATIC_SYSTEM_PROMPT, SOCRATIC_SYSTEM_PROMPT_COMPACT } from '../prompts/socraticSystemPrompt';

/** Prompt complet (Gemini). La source unique est src/prompts/socraticSystemPrompt.ts. */
export { SOCRATIC_SYSTEM_PROMPT };

/**
 * Gemma (instruction-tuned) n'a pas de rôle « system » natif :
 * on applique son gabarit de conversation officiel avec la version compacte.
 */
export function toGemmaChatPrompt(userPrompt: string): string {
  return (
    `<start_of_turn>user\n${SOCRATIC_SYSTEM_PROMPT_COMPACT}\n\nÉlève : ${userPrompt}<end_of_turn>\n` +
    `<start_of_turn>model\n`
  );
}
