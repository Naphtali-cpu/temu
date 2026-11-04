import { inquiryMessage, telegramLink, whatsappLink } from '../lib/site.js';

export function openWhatsApp(listingTitle) {
  window.open(whatsappLink(listingTitle), '_blank', 'noopener,noreferrer');
}

/**
 * Telegram cannot pre-fill a message when a chat is opened by username, so the
 * prepared inquiry is copied to the clipboard before the chat opens.
 */
export async function openTelegram(listingTitle) {
  try {
    await navigator.clipboard.writeText(inquiryMessage(listingTitle));
  } catch {
    // Clipboard access can be blocked; the chat still opens.
  }
  window.open(telegramLink(), '_blank', 'noopener,noreferrer');
}
