import type { Context } from "hono";
import { StoreSettingsService } from "../services/storeSettings.service.js";
import type { UpdateStoreSettingsInput } from "../validators/storeSettings.valadator.js";

const storeSettingsService = new StoreSettingsService();

export class StoreSettingsController {
  async getSettings(c: Context) {
    try {
      const result = await storeSettingsService.get(c.get("user").id);
      return c.json({ success: true, message: result.message, data: result.data }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  async updateSettings(c: Context) {
    try {
      const input = c.get("validatedData") as UpdateStoreSettingsInput;
      const result = await storeSettingsService.update(c.get("user").id, input);
      return c.json({ success: true, message: result.message, data: result.data }, 200);
    } catch (error) {
      return this.handleError(c, error);
    }
  }

  private handleError(c: Context, error: unknown) {
    console.error("Store settings error:", error);
    return c.json({ success: false, message: "Failed to process store settings" }, 500);
  }
}
