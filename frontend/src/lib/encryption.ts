import _sodium from 'libsodium-wrappers';

export const initSodium = async () => {
    await _sodium.ready;
    return _sodium;
};

// Derive a 256-bit symmetric key from the mutual passcode using PBKDF2
export const deriveSymmetricKey = async (passcode: string, coupleId: string): Promise<Uint8Array> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw', enc.encode(passcode), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await window.crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: enc.encode(coupleId), iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
    );
    return new Uint8Array(bits);
};

// Hash passcode for verification against stored hash (uses Web Crypto which works on localhost)
export const hashPasscode = async (passcode: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(passcode.toLowerCase().trim());
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Encrypt a message using the derived symmetric key
export const encryptMessage = async (message: string, key: Uint8Array): Promise<string> => {
    const sodium = await initSodium();
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);

    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce);
    combined.set(ciphertext, nonce.length);

    return sodium.to_base64(combined, sodium.base64_variants.ORIGINAL);
};

// Decrypt a message using the derived symmetric key
export const decryptMessage = async (encryptedBase64: string, key: Uint8Array): Promise<string> => {
    const sodium = await initSodium();
    try {
        const combined = sodium.from_base64(encryptedBase64, sodium.base64_variants.ORIGINAL);
        const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
        const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES);

        const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
        return sodium.to_string(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        return "[Decryption Failed - Invalid Key]";
    }
};
