import crypto from 'crypto';

// The key must be 32 bytes (256 bits) for AES-256
const ENCRYPTION_KEY = process.env.SUPABASE_ANON_KEY 
  ? process.env.SUPABASE_ANON_KEY.padEnd(32, '0').substring(0, 32) 
  : '12345678901234567890123456789012';
const IV_LENGTH = 16;

export function encryptKey(text) {
  if (!text) return text;
  // Don't encrypt if it's already encrypted
  if (text.includes(':') && text.split(':')[0].length === 32) return text;
  
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptKey(text) {
  if (!text) return text;
  if (!text.includes(':')) return text; // Not encrypted
  
  try {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("Erro ao descriptografar chave:", err.message);
    return text;
  }
}
