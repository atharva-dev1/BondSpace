/**
 * BondSpace Encryption Service
 * Uses AES-256-GCM for server-side operations
 * and supports libsodium-based E2E key concepts
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_SECRET || 'bondspace_32char_secret_key_2025', 'utf8').slice(0, 32);

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns: { ciphertext, iv, tag } all base64 encoded
 */
const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const tag = cipher.getAuthTag().toString('base64');
    return {
        ciphertext: encrypted,
        iv: iv.toString('base64'),
        tag,
    };
};

/**
 * Decrypt using AES-256-GCM
 */
const decrypt = (ciphertext, iv, tag) => {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

/**
 * Generate mutual passcode hash from two individual codes
 * User A: "4832" + User B: "7611" => combined => hash
 */
const generateMutualPasscode = (codeA, codeB) => {
    const combined = `${codeA}${codeB}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
};

/**
 * Also support passphrase model: "first met place + date"
 */
const generatePassphraseHash = (passphrase) => {
    return crypto.createHash('sha256').update(passphrase.toLowerCase().trim()).digest('hex');
};

/**
 * Verify passcode match
 */
const verifyPasscode = (inputHash, storedHash) => {
    return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(storedHash, 'hex'));
};

/**
 * Encrypt message for E2E (server only stores ciphertext + nonce)
 * The real E2E happens client-side, but this protects data at rest
 */
const encryptMessage = (message) => {
    const result = encrypt(message);
    return {
        encryptedMessage: result.ciphertext,
        nonce: `${result.iv}:${result.tag}`,
    };
};

const decryptMessage = (encryptedMessage, nonce) => {
    const [iv, tag] = nonce.split(':');
    return decrypt(encryptedMessage, iv, tag);
};

module.exports = {
    encrypt,
    decrypt,
    generateMutualPasscode,
    generatePassphraseHash,
    verifyPasscode,
    encryptMessage,
    decryptMessage,
};
