import crypto from 'crypto';

// Encryption key from environment or generate a random one for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

export class URLEncryption {
  private static key = Buffer.isBuffer(ENCRYPTION_KEY) ? ENCRYPTION_KEY : Buffer.from(ENCRYPTION_KEY, 'hex');

  static encrypt(text: string): string {
    try {
      // Simple base64url encoding for now (can be enhanced later with real encryption)
      return Buffer.from(text).toString('base64url');
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Fallback to plain text
    }
  }

  static decrypt(encryptedText: string): string {
    try {
      // Simple base64url decoding
      return Buffer.from(encryptedText, 'base64url').toString();
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText; // Return as-is if fails
    }
  }

  static encryptStoryId(storyId: string): string {
    return this.encrypt(`story:${storyId}`);
  }

  static decryptStoryId(encryptedId: string): string | null {
    try {
      const decrypted = this.decrypt(encryptedId);
      if (decrypted.startsWith('story:')) {
        return decrypted.substring(6); // Remove 'story:' prefix
      }
      return decrypted; // Fallback to plain ID
    } catch {
      return null;
    }
  }
}