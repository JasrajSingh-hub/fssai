/**
 * Service to handle automated and click-to-chat WhatsApp notifications
 * for FSSAI vendor compliance and customer reviews.
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
   * Sends background automated WhatsApp notification via Twilio or CallMeBot if configured.
   * Gracefully falls back to logging if external provider keys are not configured.
   */
  static async sendAutomatedNotification(phone: string = this.DEFAULT_VENDOR_PHONE, message: string): Promise<boolean> {
    const cleanPhone = phone.replace(/\D/g, '');
    const target = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    // 1. Check for Twilio WhatsApp credentials
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
          console.log(`[WhatsAppService] Successfully dispatched automated Twilio WhatsApp message to +${target}`);
          return true;
        } else {
          const errText = await res.text();
          console.warn(`[WhatsAppService] Twilio dispatch returned ${res.status}: ${errText}`);
        }
      } catch (err) {
        console.error('[WhatsAppService] Error sending Twilio notification:', err);
      }
    }

    // 2. Check for CallMeBot free WhatsApp API key
    const callmebotApiKey = process.env.CALLMEBOT_API_KEY;
    if (callmebotApiKey) {
      try {
        const url = `https://api.callmebot.com/whatsapp.php?phone=+${target}&text=${encodeURIComponent(message)}&apikey=${callmebotApiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          console.log(`[WhatsAppService] Successfully dispatched CallMeBot WhatsApp message to +${target}`);
          return true;
        }
      } catch (err) {
        console.error('[WhatsAppService] Error sending CallMeBot notification:', err);
      }
    }

    console.log(`[WhatsAppService] WhatsApp notification prepared for +${target}: "${message.slice(0, 80)}..."`);
    return false;
  }
}
