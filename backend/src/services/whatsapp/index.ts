import { Boom } from '@hapi/boom';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
  WAMessage,
  proto,
} from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';
import { getIO } from '../../socket';
import { prisma } from '../../config/database';
import { parseMessage } from '../../ai/pipeline';
import { validateBusinessData } from '../../ai/validator';
import { generateReply } from '../ai.service';

const SESSION_DIR = path.join(process.cwd(), 'wa_sessions');

class WhatsAppService {
  private sockets: Map<string, WASocket> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private connectionStatus: Map<string, 'connecting' | 'connected' | 'disconnected'> = new Map();

  async getQR(merchantId: string): Promise<string | null> {
    const existing = this.qrCodes.get(merchantId);
    if (existing) return existing;

    this.connect(merchantId);
    return null;
  }

  getStatus(merchantId: string): string {
    return this.connectionStatus.get(merchantId) || 'disconnected';
  }

  async connect(merchantId: string): Promise<void> {
    if (this.sockets.has(merchantId)) {
      return;
    }

    this.connectionStatus.set(merchantId, 'connecting');
    const io = getIO();

    const sessionDir = path.join(SESSION_DIR, merchantId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, require('pino')({ level: 'silent' })),
      },
      printQRInTerminal: false,
    });

    sock.ev.on('connection.update', async (update) => {
      const { qr, connection, lastDisconnect } = update;

      if (qr) {
        this.qrCodes.set(merchantId, qr);
        io.to(`merchant:${merchantId}`).emit('wa:qr', { qr });
      }

      if (connection === 'open') {
        this.connectionStatus.set(merchantId, 'connected');
        this.qrCodes.delete(merchantId);
        io.to(`merchant:${merchantId}`).emit('wa:status', { status: 'connected' });
        console.log(`[WhatsApp] Connected for merchant ${merchantId}`);
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

        this.connectionStatus.set(merchantId, 'disconnected');
        this.sockets.delete(merchantId);
        io.to(`merchant:${merchantId}`).emit('wa:status', { status: 'disconnected' });
        console.log(`[WhatsApp] Disconnected for merchant ${merchantId}`);

        if (shouldReconnect) {
          setTimeout(() => this.connect(merchantId), 5000);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        await this.handleIncomingMessage(merchantId, msg, sock);
      }
    });

    this.sockets.set(merchantId, sock);
  }

  async disconnect(merchantId: string): Promise<void> {
    const sock = this.sockets.get(merchantId);
    if (sock) {
      sock.logout();
      sock.ws.close();
      this.sockets.delete(merchantId);
      this.connectionStatus.set(merchantId, 'disconnected');
    }
  }

  async sendMessage(merchantId: string, jid: string, text: string): Promise<void> {
    const sock = this.sockets.get(merchantId);
    if (!sock) throw new Error('WhatsApp not connected');

    await sock.sendMessage(jid, { text });
  }

  private async handleIncomingMessage(
    merchantId: string,
    msg: WAMessage,
    sock: WASocket
  ): Promise<void> {
    try {
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      if (!text) return;

      const jid = msg.key.remoteJid!;
      const phoneNumber = jid.replace('@s.whatsapp.net', '');

      const io = getIO();

      // Find or create customer
      let isNewCustomer = false;
      let customer = await prisma.customer.findFirst({
        where: { merchantId, phone: phoneNumber },
      });

      if (!customer) {
        isNewCustomer = true;
        customer = await prisma.customer.create({
          data: { merchantId, fullName: phoneNumber, phone: phoneNumber },
        });
      }

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { merchantId, customerId: customer.id },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { merchantId, customerId: customer.id },
        });
      }

      // Store the message
      const storedMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: 'CUSTOMER',
          content: text,
          messageType: 'TEXT',
        },
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: text,
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
        },
      });

      // Emit to dashboard
      io.to(`merchant:${merchantId}`).emit('chat:newMessage', {
        conversationId: conversation.id,
        message: storedMessage,
        customer,
      });

      // Load auto-reply config
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { autoReply: true, businessName: true },
      });
      const autoReply = (merchant?.autoReply as {
        enabled?: boolean;
        confidenceThreshold?: number;
        welcomeMessage?: string;
        autoReplyIntents?: string[];
        includeCatalogInWelcome?: boolean;
      } | null) || {};

      // NEW CUSTOMER — send welcome message with product catalog
      if (isNewCustomer && autoReply.includeCatalogInWelcome && autoReply.enabled) {
        let welcomeText = autoReply.welcomeMessage || '';

        if (welcomeText.includes('{businessName}')) {
          welcomeText = welcomeText.replace(/\{businessName\}/g, merchant?.businessName || 'Store');
        }

        if (welcomeText.includes('{productCatalog}')) {
          const products = await prisma.product.findMany({
            where: { merchantId, isActive: true },
            take: 20,
          });
          const catalog = products.length > 0
            ? products.map((p) => `• ${p.productName} — ₹${p.sellingPrice}/${p.unit}`).join('\n')
            : 'We have a wide range of products available. Reply with what you need!';
          welcomeText = welcomeText.replace(/\{productCatalog\}/g, catalog);
        }

        await sock.sendMessage(jid, { text: welcomeText });

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderType: 'AI',
            content: welcomeText,
            messageType: 'TEXT',
          },
        });

        io.to(`merchant:${merchantId}`).emit('ai:suggestedReply', {
          conversationId: conversation.id,
          reply: welcomeText,
          autoSent: true,
        });
        return;
      }

      // AI Processing
      const aiResult = await parseMessage(text, {
        customerName: customer.fullName,
      });

      await prisma.message.update({
        where: { id: storedMessage.id },
        data: { aiProcessed: true, intent: aiResult.intent, confidence: aiResult.confidence },
      });

      // Emit AI result
      io.to(`merchant:${merchantId}`).emit('ai:parsed', {
        messageId: storedMessage.id,
        conversationId: conversation.id,
        intent: aiResult.intent,
        confidence: aiResult.confidence,
        language: aiResult.language,
        products: aiResult.products,
      });

      // AUTO-CREATE DRAFT ORDER when intent is NEW_ORDER with products
      let draftOrderId: string | null = null;
      if (aiResult.intent === 'NEW_ORDER' && aiResult.products.length > 0) {
        try {
          const merchantProducts = await prisma.product.findMany({
            where: { merchantId, isActive: true },
          });

          let subtotal = 0;
          const orderItems: { productId: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

          for (const ep of aiResult.products) {
            const name = ep.name.toLowerCase();
            const match = merchantProducts.find(
              (p) => p.productName.toLowerCase().includes(name) || name.includes(p.productName.toLowerCase())
            );
            if (match) {
              const qty = parseFloat(ep.quantity) || 1;
              const totalPrice = qty * match.sellingPrice;
              subtotal += totalPrice;
              orderItems.push({
                productId: match.id,
                quantity: qty,
                unitPrice: match.sellingPrice,
                totalPrice,
              });
            }
          }

          if (orderItems.length > 0) {
            const draft = await prisma.order.create({
              data: {
                merchantId,
                customerId: customer.id,
                status: 'DRAFT',
                subtotal,
                total: subtotal,
                source: 'WHATSAPP',
                items: { create: orderItems },
              },
              include: { customer: true, items: { include: { product: true } } },
            });
            draftOrderId = draft.id;

            try {
              getIO().to(`merchant:${merchantId}`).emit('order:created', {
                orderId: draft.id,
                customerName: draft.customer?.fullName,
                total: draft.total,
                status: 'DRAFT',
              });
            } catch {}

            // Create notification
            await prisma.notification.create({
              data: {
                merchantId,
                type: 'ORDER',
                title: 'New Draft Order',
                message: `${draft.items.length} item(s) from ${draft.customer?.fullName} — ₹${draft.total}`,
              },
            });
          }
        } catch (err) {
          console.error('[WhatsApp] Error creating draft order:', err);
        }
      }

      // Generate reply
      let suggestedReply: string;
      if (draftOrderId) {
        suggestedReply = `Thank you! Your order has been received and is being reviewed. We'll confirm shortly.`;
      } else {
        suggestedReply = await generateReply(text, {
          intent: aiResult.intent,
          products: aiResult.products.map((p) => `${p.name} (${p.quantity})`).join(', '),
          customerName: customer.fullName,
        });
      }

      // AUTO-REPLY if enabled and conditions met
      const autoReplyEnabled = autoReply.enabled === true;
      const confidenceOk = (aiResult.confidence ?? 0) >= (autoReply.confidenceThreshold ?? 0.85);
      const intentOk = (autoReply.autoReplyIntents ?? []).includes(aiResult.intent);
      const notNewCustomerHandled = !isNewCustomer;

      if (autoReplyEnabled && confidenceOk && intentOk && notNewCustomerHandled) {
        await sock.sendMessage(jid, { text: suggestedReply });

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderType: 'AI',
            content: suggestedReply,
            messageType: 'TEXT',
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessage: suggestedReply, lastMessageAt: new Date() },
        });

        io.to(`merchant:${merchantId}`).emit('ai:suggestedReply', {
          conversationId: conversation.id,
          reply: suggestedReply,
          autoSent: true,
        });
      } else {
        io.to(`merchant:${merchantId}`).emit('ai:suggestedReply', {
          conversationId: conversation.id,
          reply: suggestedReply,
          autoSent: false,
        });
      }

    } catch (error) {
      console.error('[WhatsApp] Error handling message:', error);
    }
  }
}

export const whatsappService = new WhatsAppService();
