import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { parseMessage, detectIntentOnly, extractEntitiesOnly } from '../ai/pipeline';
import { validateBusinessData } from '../ai/validator';
import { generateReply, generateDailySummary, generateInsights } from '../services/ai.service';

export async function parseMessageController(req: AuthRequest, res: Response) {
  try {
    const { message, customerPhone } = req.body;
    if (!message) return sendError(res, 'Message is required', 422);

    const result = await parseMessage(message, { customerName: customerPhone });
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to parse message');
  }
}

export async function detectIntentController(req: AuthRequest, res: Response) {
  try {
    const { message } = req.body;
    if (!message) return sendError(res, 'Message is required', 422);

    const result = await detectIntentOnly(message);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to detect intent');
  }
}

export async function extractEntitiesController(req: AuthRequest, res: Response) {
  try {
    const { message } = req.body;
    if (!message) return sendError(res, 'Message is required', 422);

    const result = await extractEntitiesOnly(message);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to extract entities');
  }
}

export async function getSummary(req: AuthRequest, res: Response) {
  try {
    const summary = await generateDailySummary(req.user!.merchantId);
    return sendSuccess(res, { summary });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to generate summary');
  }
}

export async function getSuggestions(req: AuthRequest, res: Response) {
  try {
    const suggestions = await generateInsights(req.user!.merchantId);
    return sendSuccess(res, { suggestions });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to generate suggestions');
  }
}

export async function validateController(req: AuthRequest, res: Response) {
  try {
    const { customerPhone, products } = req.body;
    if (!products || !Array.isArray(products)) {
      return sendError(res, 'Products array is required', 422);
    }

    const result = await validateBusinessData(req.user!.merchantId, customerPhone, products);
    return sendSuccess(res, result);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to validate business data');
  }
}
