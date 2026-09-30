import { timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { TelegramService } from "../services/telegram.service.js";

const telegramService = new TelegramService();

export class TelegramController {
  async getStatus(c: Context) {
    try {
      const data = await telegramService.getStatus(c.get("user").id);
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async createLink(c: Context) {
    try {
      const data = await telegramService.createLink(c.get("user").id);
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async updateSettings(c: Context) {
    try {
      const { enabled } = await c.req.json();

      if (typeof enabled !== "boolean") {
        return c.json({ success: false, message: "enabled must be a boolean" }, 400);
      }

      await telegramService.setEnabled(c.get("user").id, enabled);
      return c.json({ success: true, message: "Telegram settings updated" }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async disconnect(c: Context) {
    try {
      await telegramService.disconnect(c.get("user").id);
      return c.json({ success: true, message: "Telegram disconnected" }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async sendTest(c: Context) {
    try {
      await telegramService.sendTest(c.get("user").id);
      return c.json({ success: true, message: "Test message sent" }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  // Called by Telegram. Authenticated by the secret token we registered with setWebhook.
  async webhook(c: Context) {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    const received = c.req.header("x-telegram-bot-api-secret-token") ?? "";

    if (!expected) {
      return c.json({ success: false, message: "Webhook not configured" }, 503);
    }

    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return c.json({ success: false, message: "Forbidden" }, 403);
    }

    try {
      await telegramService.handleUpdate(await c.req.json());
    } catch (error) {
      // Always 200 so Telegram doesn't keep retrying a bad update
      console.error("Telegram webhook error:", error);
    }

    return c.json({ ok: true }, 200);
  }

  private handleError(c: Context, error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      return c.json(
        { success: false, message: (error as any).message || "An error occurred" },
        (error as any).statusCode || 500,
      );
    }

    console.error("Telegram controller error:", error);
    return c.json({ success: false, message: "An unexpected error occurred" }, 500);
  }
}
