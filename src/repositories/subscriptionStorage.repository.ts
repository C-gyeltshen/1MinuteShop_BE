import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Private bucket: payment proofs are only ever served to admins via short-lived signed URLs.
const BUCKET_NAME = "subscription-payment";
const SIGNED_URL_TTL_SECONDS = 60 * 10;

export class SubscriptionStorageRepository {
  private supabase: SupabaseClient;
  private bucketReady: Promise<void> | null = null;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  private ensureBucket() {
    this.bucketReady ??= (async () => {
      const { data } = await this.supabase.storage.getBucket(BUCKET_NAME);
      if (data) return;

      const { error } = await this.supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
      });
      if (error && !/already exists/i.test(error.message)) {
        this.bucketReady = null;
        throw new Error(`Could not prepare storage bucket: ${error.message}`);
      }
    })();
    return this.bucketReady;
  }

  async upload(path: string, buffer: Buffer, contentType: string) {
    await this.ensureBucket();

    const { error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, { contentType, cacheControl: "3600", upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);
  }

  async remove(path: string) {
    await this.supabase.storage.from(BUCKET_NAME).remove([path]);
  }

  async signedUrl(path: string): Promise<string | null> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (error) {
      console.error("Signed URL error:", error.message);
      return null;
    }
    return data.signedUrl;
  }
}
