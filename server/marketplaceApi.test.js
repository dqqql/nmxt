import { describe, expect, it } from 'vitest';
import {
  createSessionCookie,
  hasValidSession,
  verifyPassword,
} from './marketplaceApi';

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

async function passwordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100000;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  ));
  return `pbkdf2$${iterations}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

describe('marketplace API authentication', () => {
  it('verifies PBKDF2 password hashes without storing plaintext', async () => {
    const stored = await passwordHash('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', stored)).resolves.toBe(true);
    await expect(verifyPassword('wrong', stored)).resolves.toBe(false);
  });

  it('accepts signed sessions and rejects tampered cookies', async () => {
    const secret = 'a-long-test-session-secret';
    const cookie = await createSessionCookie(secret);
    const pair = cookie.split(';')[0];
    await expect(hasValidSession(new Request('https://example.dev/admin', {
      headers: { Cookie: pair },
    }), secret)).resolves.toBe(true);
    await expect(hasValidSession(new Request('https://example.dev/admin', {
      headers: { Cookie: `${pair}tampered` },
    }), secret)).resolves.toBe(false);
  });
});
