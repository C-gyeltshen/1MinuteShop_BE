import { randomBytes } from "node:crypto";
import { TelegramRepository } from "../repositories/telegram.repository.js";

const telegramRepository = new TelegramRepository();

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;
const SEND_TIMEOUT_MS = 8000;

export interface NewOrderNotification {
  storeName: string;
  orderNumber: number;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  city: string;
  items: { productName: string; quantity: number }[];
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export class TelegramService {
  private get botToken() {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  private get botUsername() {
    return process.env.TELEGRAM_BOT_USERNAME;
  }

  isConfigured() {
    return Boolean(this.botToken && this.botUsername);
  }

  // Low-level Bot API call. Returns true on success, never throws.
  private async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!this.botToken) {
      console.warn("Telegram: TELEGRAM_BOT_TOKEN is not set, skipping message");
      return false;
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });

      if (!res.ok) {
        // Body holds Telegram's error description; the URL (with token) is never logged
        console.error(`Telegram sendMessage failed (${res.status}):`, await res.text());
        return false;
      }
      return true;
    } catch (error: any) {
      console.error("Telegram sendMessage error:", error?.message ?? error);
      return false;
    }
  }

  // ── Owner-facing operations (called from authenticated routes) ──────────

  async getStatus(storeOwnerId: string) {
    const connection = await telegramRepository.findByStoreOwnerId(storeOwnerId);

    return {
      available: this.isConfigured(),
      connected: Boolean(connection?.chatId),
      notificationsEnabled: connection?.notificationsEnabled ?? false,
    };
  }

  async createLink(storeOwnerId: string) {
    if (!this.isConfigured()) {
      throw { statusCode: 503, message: "Telegram notifications are not configured" };
    }

    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS);
    await telegramRepository.saveLinkToken(storeOwnerId, token, expiresAt);

    return {
      url: `https://t.me/${this.botUsername}?start=${token}`,
      expiresAt,
    };
  }

  async setEnabled(storeOwnerId: string, enabled: boolean) {
    const connection = await telegramRepository.findByStoreOwnerId(storeOwnerId);

    if (!connection?.chatId) {
      throw { statusCode: 400, message: "Telegram is not connected" };
    }

    await telegramRepository.setEnabled(storeOwnerId, enabled);
  }

  async disconnect(storeOwnerId: string) {
    await telegramRepository.remove(storeOwnerId);
  }

  async sendTest(storeOwnerId: string) {
    const connection = await telegramRepository.findByStoreOwnerId(storeOwnerId);

    if (!connection?.chatId) {
      throw { statusCode: 400, message: "Telegram is not connected" };
    }

    const sent = await this.sendMessage(
      connection.chatId,
      "✅ <b>Test notification</b>\nYou will receive new order alerts here.",
    );

    if (!sent) {
      throw { statusCode: 502, message: "Could not reach Telegram. Please try again." };
    }
  }

  // ── Webhook: Telegram -> us ─────────────────────────────────────────────

  async handleUpdate(update: any) {
    const message = update?.message;
    const text: unknown = message?.text;
    const chatId = message?.chat?.id;

    // Only private chats can link a store
    if (typeof text !== "string" || chatId === undefined || message?.chat?.type !== "private") {
      return;
    }

    const match = /^\/start(?:@\w+)?\s+(\S+)/.exec(text);

    if (!match) {
      if (/^\/start(?:@\w+)?\s*$/.test(text)) {
        await this.sendMessage(
          String(chatId),
          "👋 To receive order alerts, open your 1MinuteShop dashboard → Settings → Telegram and tap <b>Connect</b>.",
        );
      }
      return;
    }

    const connection = await telegramRepository.findByLinkToken(match[1]);

    if (!connection || !connection.linkTokenExpiresAt || connection.linkTokenExpiresAt < new Date()) {
      await this.sendMessage(
        String(chatId),
        "⚠️ This link is invalid or has expired. Please generate a new one from your dashboard.",
      );
      return;
    }

    await telegramRepository.completeLink(connection.id, String(chatId));
    await this.sendMessage(
      String(chatId),
      "✅ <b>Connected!</b> You'll get a message here whenever a customer places an order.",
    );
  }

  // ── Order notification (fire-and-forget from order creation) ────────────

  async notifyNewOrder(storeOwnerId: string, order: NewOrderNotification) {
    const connection = await telegramRepository.findByStoreOwnerId(storeOwnerId);

    if (!connection?.chatId || !connection.notificationsEnabled) return;

    const items = order.items
      .map((item) => `• ${escapeHtml(item.productName)} × ${item.quantity}`)
      .join("\n");

    const dashboardUrl = `${process.env.FRONTEND_URL || "https://laso.la"}/store/dashboard`;

    const text = [
      `🛒 <b>New order #${order.orderNumber}</b> — ${escapeHtml(order.storeName)}`,
      "",
      items,
      "",
      `<b>Total:</b> Nu.${order.totalAmount.toFixed(2)}`,
      `<b>Customer:</b> ${escapeHtml(order.customerName)} (${escapeHtml(order.customerPhone)})`,
      `<b>City:</b> ${escapeHtml(order.city)}`,
      "",
      `Verify the payment and confirm the order in your <a href="${escapeHtml(dashboardUrl)}">dashboard</a>.`,
    ].join("\n");

    await this.sendMessage(connection.chatId, text);
  }
}
