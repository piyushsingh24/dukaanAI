import Groq from 'groq-sdk';
import { AI_CONFIG } from './config';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function groqChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: AI_CONFIG.model,
    messages,
    temperature: options?.temperature ?? AI_CONFIG.temperature,
    max_tokens: options?.maxTokens ?? AI_CONFIG.maxTokens,
    response_format: { type: 'json_object' },
  });

  return completion.choices[0]?.message?.content || '{}';
}

export async function groqChatText(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: AI_CONFIG.model,
    messages,
    temperature: options?.temperature ?? AI_CONFIG.temperature,
    max_tokens: options?.maxTokens ?? AI_CONFIG.maxTokens,
  });

  return completion.choices[0]?.message?.content || '';
}
