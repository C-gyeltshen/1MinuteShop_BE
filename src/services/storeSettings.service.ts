import { StoreSettingsRepository } from "../repositories/storeSettings.repository.js";
import type { UpdateStoreSettingsInput } from "../validators/storeSettings.valadator.js";

const storeSettingsRepository = new StoreSettingsRepository();

type StoreSettingsRow = NonNullable<
  Awaited<ReturnType<StoreSettingsRepository["findByStoreOwnerId"]>>
>;

const toResponse = (settings: StoreSettingsRow) => ({
  storeDescription: settings.storeDescription ?? "",
  contactEmail: settings.contactEmail ?? "",
  contactPhone: settings.contactPhone ?? "",
  address: settings.address ?? "",
  currency: settings.currency,
  taxPercentage: Number(settings.taxPercentage),
  shippingEnabled: settings.shippingEnabled,
  shippingCost: settings.shippingCost === null ? null : Number(settings.shippingCost),
});

export class StoreSettingsService {
  // Returns null when the owner has never saved settings (UI falls back to defaults)
  async get(storeOwnerId: string) {
    const settings = await storeSettingsRepository.findByStoreOwnerId(storeOwnerId);

    return {
      statusCode: 200,
      message: "Store settings retrieved successfully",
      data: settings ? toResponse(settings) : null,
    };
  }

  async update(storeOwnerId: string, data: UpdateStoreSettingsInput) {
    const settings = await storeSettingsRepository.upsert(storeOwnerId, data);

    return {
      statusCode: 200,
      message: "Store settings saved successfully",
      data: toResponse(settings),
    };
  }
}
