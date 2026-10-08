import type { Context } from "hono";
import { PaymentAccountService } from "../services/paymentAccount.service.js";
import type { UpsertPaymentAccountInput } from "../validators/paymentAccount.valadator.js";

const paymentAccountService = new PaymentAccountService();

export class PaymentAccountController {
  async getMine(c: Context) {
    try {
      const result = await paymentAccountService.get(c.get("user").id);
      return c.json({ success: true, message: result.message, data: result.data }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async saveMine(c: Context) {
    try {
      const input = c.get("validatedData") as UpsertPaymentAccountInput;
      const result = await paymentAccountService.save(c.get("user").id, input);
      return c.json({ success: true, message: result.message, data: result.data }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async getPublic(c: Context) {
    try {
      const result = await paymentAccountService.getPublic(c.req.param("subDomain"));
      return c.json({ success: true, data: result.data }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  private handleError(c: Context, error: any) {
    if (error?.statusCode) {
      return c.json(
        { success: false, code: error.code, message: error.message },
        error.statusCode,
      );
    }
    console.error("Payment account error:", error);
    return c.json({ success: false, message: "Failed to process payment account" }, 500);
  }
}
