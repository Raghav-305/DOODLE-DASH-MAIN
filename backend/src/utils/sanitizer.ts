import sanitizeHtml from 'sanitize-html';

export function sanitizePlayerName(name: string): string {
  if (!name) return '';

  // Remove HTML
  let cleaned = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} });

  // Remove special characters except basic punctuation
  cleaned = cleaned.replace(/[^\w\s\-_.]/gi, '');

  // Trim and limit length
  cleaned = cleaned.trim().substring(0, 20);

  // Default if empty
  if (!cleaned) cleaned = 'Player';

  return cleaned;
}

export function sanitizeMessage(message: string): string {
  if (!message) return '';

  // Remove HTML
  let cleaned = sanitizeHtml(message, { allowedTags: [], allowedAttributes: {} });

  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}
