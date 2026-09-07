/**
 * Service to handle automated Meta Cloud API, Twilio, CallMeBot,
 * and click-to-chat WhatsApp notifications for FSSAI vendor compliance.
 */
export class WhatsAppService {
  public static readonly DEFAULT_VENDOR_PHONE = '918102098695';

  /**
   * Builds the official WhatsApp click-to-chat URL for instant messaging.
   */
  static getClickToChatUrl(phone: string = this.DEFAULT_VENDOR_PHONE, message: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const target = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Sends background automated WhatsApp notification via:
   * 1. Official Meta WhatsApp Cloud API (Primary)
   * 2. Twilio WhatsApp API (Secondary)
   * 3. CallMeBot Free WhatsApp API (Fallback)
   */
  static async sendAutomatedNotification(phone: string = this.DEFAULT_VENDOR_PHONE, message: string): Promise<boolean> {
    const cleanPhone = phone.replace(/\D/g, '');
    const target = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    // 1. Meta WhatsApp Cloud API (Official Business Platform)
    const metaToken = process.env.META_WHATSAPP_TOKEN;
    const metaPhoneId = process.env.META_PHONE_NUMBER_ID;

    if (metaToken && metaPhoneId) {
      try {
        const url = `https://graph.facebook.com/v20.0/${metaPhoneId}/messages`;
        const payload: any = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: target,
        };

        if (process.env.META_TEMPLATE_NAME) {
          payload.type = 'template';
          payload.template = {
            name: process.env.META_TEMPLATE_NAME,
            language: { code: process.env.META_TEMPLATE_LANG || 'en_US' },
          };
        } else {
          payload.type = 'text';
          payload.text = {
            preview_url: true,
            body: message,
          };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data: any = await res.json();
          console.log(`[WhatsAppService] Successfully sent Meta Cloud API WhatsApp message to +${target}. Message ID:`, data.messages?.[0]?.id);
          return true;
        } else {
          const errData = await res.json().catch(() => null);
          console.warn(`[WhatsAppService] Meta Cloud API error ${res.status}:`, JSON.stringify(errData));
        }
      } catch (err) {
        console.error('[WhatsAppService] Error connecting to Meta Cloud API:', err);
      }
    }

    // 2. Twilio WhatsApp API
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (twilioSid && twilioToken) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const body = new URLSearchParams({
          From: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
          To: `whatsapp:+${target}`,
          Body: message,
        });

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        });

        if (res.ok) {
          console.log(`[WhatsAppService] Successfully sent automated Twilio WhatsApp message to +${target}`);
          return true;
        } else {
          const errText = await res.text();
          console.warn(`[WhatsAppService] Twilio dispatch returned ${res.status}: ${errText}`);
        }
      } catch (err) {
        console.error('[WhatsAppService] Error sending Twilio notification:', err);
      }
    }

    // 3. CallMeBot free WhatsApp API key
    const callmebotApiKey = process.env.CALLMEBOT_API_KEY;
    if (callmebotApiKey) {
      try {
        const url = `https://api.callmebot.com/whatsapp.php?phone=+${target}&text=${encodeURIComponent(message)}&apikey=${callmebotApiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          console.log(`[WhatsAppService] Successfully sent CallMeBot WhatsApp message to +${target}`);
          return true;
        }
      } catch (err) {
        console.error('[WhatsAppService] Error sending CallMeBot notification:', err);
      }
    }

    console.log(`[WhatsAppService] Dispatched via Click-to-Chat / In-App alert for +${target}: "${message.slice(0, 80)}..."`);
    return false;
  }
}
