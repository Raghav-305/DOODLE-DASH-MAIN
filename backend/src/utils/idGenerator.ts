export function generateRoomCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
