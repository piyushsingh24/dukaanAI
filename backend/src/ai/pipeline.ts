import { SYSTEM_PROMPT, INTENT_EXAMPLES } from './config';
import { groqChat } from './groq';

interface ParsedMessage {
  intent: string;
  confidence: number;
  language: string;
  customer: { name?: string; phone?: string } | null;
  products: { name: string; quantity: string; unit?: string }[];
  reply: string | null;
}

export async function parseMessage(
  message: string,
  context?: {
    customerName?: string;
    products?: { name: string; price: number; unit: string }[];
    previousOrders?: string[];
  }
): Promise<ParsedMessage> {
  let contextInfo = '';
  if (context) {
    const parts: string[] = [];
    if (context.customerName) parts.push(`Customer: ${context.customerName}`);
    if (context.products?.length) {
      const productList = context.products.map((p) => `${p.name} (₹${p.price}/${p.unit})`).join(', ');
      parts.push(`Available products: ${productList}`);
    }
    if (context.previousOrders?.length) {
      parts.push(`Previous orders: ${context.previousOrders.join('; ')}`);
    }
    if (parts.length > 0) contextInfo = `\nContext: ${parts.join(' | ')}`;
  }

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT + contextInfo },
    ...INTENT_EXAMPLES.map((ex) => ({
      role: ex.role as 'user' | 'assistant',
      content: ex.content,
    })),
    { role: 'user' as const, content: message },
  ];

  try {
    const response = await groqChat(messages);
    const parsed = JSON.parse(response) as ParsedMessage;

    return {
      intent: parsed.intent || 'UNKNOWN',
      confidence: parsed.confidence || 0,
      language: parsed.language || 'unknown',
      customer: parsed.customer || null,
      products: parsed.products || [],
      reply: parsed.reply || null,
    };
  } catch (error) {
    console.error('[AI Parse Error]', error);
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      language: 'unknown',
      customer: null,
      products: [],
      reply: null,
    };
  }
}

export async function detectIntentOnly(message: string): Promise<{ intent: string; confidence: number }> {
  const result = await parseMessage(message);
  return { intent: result.intent, confidence: result.confidence };
}

export async function extractEntitiesOnly(
  message: string
): Promise<{ products: { name: string; quantity: string; unit?: string }[] }> {
  const result = await parseMessage(message);
  return { products: result.products };
}
