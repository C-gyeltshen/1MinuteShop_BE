import type { Context } from "hono";
import { z } from "zod";
import { SubscriptionService } from "../services/subscription.service.js";

const subscriptionService = new SubscriptionService();

const rejectSchema = z.object({ reason: z.string().trim().min(3).max(300) });
const statusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export class SubscriptionController {
  async getStatus(c: Context) {
    try {
      const data = await subscriptionService.getStatus(c.get("user").id);
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async listMine(c: Context) {
    try {
      const data = await subscriptionService.listMine(c.get("user").id);
      return c.json({ success: true, data }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  // multipart/form-data: file, months (default 1), reference (optional)
  async submitPayment(c: Context) {
    try {
      const contentType = c.req.header("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return c.json({ success: false, message: "Use multipart/form-data" }, 415);
      }

      const form = await c.req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return c.json({ success: false, message: "Payment screenshot is required" }, 400);
      }

      const months = Number(form.get("months") ?? 1);
      const reference = (form.get("reference") as string | null) ?? undefined;

      const data = await subscriptionService.submitPayment(c.get("user").id, {
        file,
        months,
        reference,
      });

      return c.json(
        { success: true, message: "Payment submitted. We'll review it shortly.", data },
        201,
      );
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  // ── Admin ───────────────────────────────────────────────────────────────

  async adminList(c: Context) {
    try {
      const parsed = statusSchema.safeParse(c.req.query("status"));
      const result = await subscriptionService.adminList(parsed.success ? parsed.data : undefined);
      return c.json({ success: true, ...result }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async approve(c: Context) {
    try {
      const data = await subscriptionService.approve(c.req.param("id"), c.get("user").id);
      return c.json({ success: true, message: "Payment approved", data }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async reject(c: Context) {
    try {
      const body = rejectSchema.safeParse(await c.req.json().catch(() => ({})));
      if (!body.success) {
        return c.json({ success: false, message: "A rejection reason (3-300 chars) is required" }, 400);
      }

      await subscriptionService.reject(c.req.param("id"), c.get("user").id, body.data.reason);
      return c.json({ success: true, message: "Payment rejected" }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  private handleError(c: Context, error: unknown) {
    if (error && typeof error === "object" && "statusCode" in error) {
      return c.json(
        { success: false, message: (error as any).message || "An error occurred" },
        (error as any).statusCode || 500,
      );
    }

    console.error("Subscription controller error:", error);
    return c.json({ success: false, message: "An unexpected error occurred" }, 500);
  }
}
