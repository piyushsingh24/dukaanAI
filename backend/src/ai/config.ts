export const AI_CONFIG = {
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  temperature: 0.1,
  maxTokens: 1024,
};

export const SYSTEM_PROMPT = `You are an intelligent retail assistant for Indian merchants called DukaanAI.

Your job is to:
1. Understand customer messages in English, Hindi, or Hinglish
2. Detect the customer's intent
3. Extract structured business information (products, quantities, prices, addresses)
4. Generate professional, friendly replies in the customer's language
5. Never invent products, prices, or customer information
6. If information is missing or unclear, return null for those fields

Always respond with valid JSON only. No markdown, no explanations.`;

export const INTENT_EXAMPLES = [
  {
    role: 'user',
    content: '2kg atta bhej dena',
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      intent: 'NEW_ORDER',
      confidence: 0.98,
      language: 'Hinglish',
      customer: null,
      products: [{ name: 'Atta', quantity: '2kg', unit: 'kg' }],
      reply: 'Ji, 2kg atta order le liya hai. Kuch aur chahiye?',
    }),
  },
  {
    role: 'user',
    content: 'Kal ka bill bhej do',
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      intent: 'INVOICE_REQUEST',
      confidence: 0.97,
      language: 'Hinglish',
      customer: null,
      products: [],
      reply: 'Ji, kal ka bill bhej rahe hain. Kripya karke dekhein.',
    }),
  },
  {
    role: 'user',
    content: 'Payment kab tak clear hoga?',
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      intent: 'PAYMENT_INQUIRY',
      confidence: 0.96,
      language: 'Hinglish',
      customer: null,
      products: [],
      reply: 'Aapka payment 2-3 din mein clear ho jayega. Agar koi problem ho to humein batayein.',
    }),
  },
  {
    role: 'user',
    content: 'Delivery kab hogi?',
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      intent: 'DELIVERY_STATUS',
      confidence: 0.97,
      language: 'Hinglish',
      customer: null,
      products: [],
      reply: 'Aapki delivery aaj 4-6 baje ke beech mein aa jayegi. Kripya wait karein.',
    }),
  },
];

export const INSIGHT_PROMPT = `You are a business analytics assistant for an Indian retail store.

Analyze the following business data and return structured insights as JSON:
- dailySummary: 1-2 sentence summary of the day
- topProducts: array of {name, sold} - top selling items
- pendingAmount: total pending payment amount
- lowStockAlerts: array of products that need restocking
- recommendations: array of actionable suggestions

Return only valid JSON.`;

export const REPLY_PROMPT = `You are a polite retail assistant for an Indian merchant.

Generate a friendly, professional reply to the customer's message.
- Use the same language as the customer (Hindi, Hinglish, or English)
- Be concise and warm
- Include order details if applicable
- Never reveal internal business information
- Never make promises about delivery times you cannot guarantee

Return only the reply text, no JSON.`;
