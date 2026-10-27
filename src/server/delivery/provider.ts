import path from "node:path";
import { getServerEnvironment } from "../env";
import { LocalObjectStorage } from "../storage/local";

export type DeliveryMessage = {
  organizationId: string;
  campaignId: string;
  deliveryId: string;
  idempotencyKey: string;
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export type DeliveryResult = {
  provider: "capture";
  providerMessageId: string;
  storageKey: string;
  status: "captured";
};

export interface DeliveryProvider {
  deliver(message: DeliveryMessage): Promise<DeliveryResult>;
}

export class CaptureDeliveryProvider implements DeliveryProvider {
  private readonly storage = new LocalObjectStorage(
    getServerEnvironment().EMAIL_CAPTURE_DIR,
  );

  async deliver(message: DeliveryMessage): Promise<DeliveryResult> {
    if (getServerEnvironment().EMAIL_DELIVERY_MODE !== "capture") {
      throw new Error("Capture delivery is not enabled.");
    }
    const storageKey = path.join(
      message.organizationId,
      message.campaignId,
      message.deliveryId,
      "message.json",
    );
    try {
      await this.storage.put(
        storageKey,
        JSON.stringify(
          {
            ...message,
            capturedAt: new Date().toISOString(),
            provider: "capture",
          },
          null,
          2,
        ),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    return {
      provider: "capture",
      providerMessageId: `capture_${message.deliveryId}`,
      storageKey: storageKey.replaceAll("\\", "/"),
      status: "captured",
    };
  }
}
