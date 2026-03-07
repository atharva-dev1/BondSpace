const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateMutualPasscode, generatePassphraseHash, verifyPasscode } = require('../services/encryptionService');

// POST /api/bond/request — Send a bond request
const sendRequest = async (req, res) => {
    try {
        const { to_user_id } = req.body;
        const fromId = req.user.id;

        if (fromId === to_user_id) return res.status(400).json({ error: 'Cannot bond with yourself' });

        const existing = await query(
            'SELECT id, status FROM couples WHERE (user1_id=$1 AND user2_id=$2) OR (user1_id=$2 AND user2_id=$1)',
            [fromId, to_user_id]
        );
        if (existing.rows.length > 0) {
            const bond = existing.rows[0];
            if (bond.status === 'bonded') return res.status(409).json({ error: 'Already bonded!' });
            if (bond.status === 'pending') return res.status(409).json({ error: 'Request already sent' });
        }

        const result = await query(
            'INSERT INTO couples (id, user1_id, user2_id, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [uuidv4(), fromId, to_user_id, 'pending']
        );

        res.status(201).json({ bond: result.rows[0], message: '💌 Bond request sent!' });
    } catch (err) {
        console.error('Send request error:', err);
        res.status(500).json({ error: 'Failed to send bond request' });
    }
};

// POST /api/bond/accept — Accept a bond request
const acceptRequest = async (req, res) => {
    try {
        const { couple_id } = req.body;
        const userId = req.user.id;

        const result = await query('SELECT * FROM couples WHERE id=$1 AND user2_id=$2 AND status=$3', [couple_id, userId, 'pending']);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Bond request not found' });

        const updated = await query(
            'UPDATE couples SET status=$1, connected_at=NOW() WHERE id=$2 RETURNING *',
            ['bonded', couple_id]
        );

        res.json({ bond: updated.rows[0], message: '🔗 You are now bonded! Welcome to your private space 💕' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to accept bond request' });
    }
};

// POST /api/bond/set-passcode — Set a shared passcode for the couple
// Both partners must agree on ONE shared code.
// First user sets it → it gets saved as a hash.
// If a hash already exists, we verify the new submission matches.
const setPasscode = async (req, res) => {
    try {
        const { couple_id, my_code } = req.body;
        if (!my_code || my_code.trim().length < 3) {
            return res.status(400).json({ error: 'Passcode must be at least 3 characters' });
        }
        const userId = req.user.id;

        const coupleRes = await query(
            'SELECT * FROM couples WHERE id=$1 AND (user1_id=$2 OR user2_id=$2) AND status=$3',
            [couple_id, userId, 'bonded']
        );
        if (coupleRes.rows.length === 0) return res.status(404).json({ error: 'Bonded couple not found' });

        const couple = coupleRes.rows[0];

        // If passcode already set — this is partner confirming with the same code
        if (couple.mutual_passcode_hash) {
            const inputHash = generatePassphraseHash(my_code);
            const match = verifyPasscode(inputHash, couple.mutual_passcode_hash);
            if (match) {
                return res.json({ message: '✅ Passcode confirmed! Your space is protected 💕', locked: true });
            } else {
                return res.status(401).json({ error: 'Passcode does not match what your partner set. Agree on a shared code.' });
            }
        }

        // First user to set it — save the hash
        const hash = generatePassphraseHash(my_code);
        await query('UPDATE couples SET mutual_passcode_hash=$1 WHERE id=$2', [hash, couple_id]);

        res.json({
            message: 'Passcode set! Now ask your partner to enter the same code to confirm. 🔐',
            locked: false
        });
    } catch (err) {
        console.error('Set passcode error:', err);
        res.status(500).json({ error: 'Failed to set passcode' });
    }
};

// POST /api/bond/verify-lock — Unlock the space with the shared passcode
const verifyLock = async (req, res) => {
    try {
        const { couple_id, code_a } = req.body;
        console.log('[verifyLock] couple_id:', couple_id, '| code received:', JSON.stringify(code_a));

        const couple = await query('SELECT mutual_passcode_hash FROM couples WHERE id=$1', [couple_id]);
        if (!couple.rows[0]?.mutual_passcode_hash) return res.status(400).json({ error: 'Lock not set' });

        const inputHash = generatePassphraseHash(code_a);
        const storedHash = couple.rows[0].mutual_passcode_hash;
        console.log('[verifyLock] inputHash:', inputHash, '| storedHash:', storedHash);

        const match = verifyPasscode(inputHash, storedHash);
        if (!match) return res.status(401).json({ error: 'Wrong passcode! Try again 🔒' });

        res.json({ unlocked: true, message: '🔓 Chat unlocked!' });
    } catch (err) {
        console.error('Verify lock error:', err);
        res.status(500).json({ error: 'Failed to verify passcode' });
    }
};

// POST /api/bond/disconnect — Mutual disconnection (requires both to confirm)
const disconnect = async (req, res) => {
    try {
        const { couple_id, emergency } = req.body;
        const userId = req.user.id;

        if (emergency) {
            // Emergency break — immediate
            await query('UPDATE couples SET status=$1 WHERE id=$2 AND (user1_id=$3 OR user2_id=$3)', ['broken', couple_id, userId]);
            return res.json({ message: '⚠️ Emergency disconnect activated. Stay safe.' });
        }

        const redis = require('../config/redis');
        const key = `disconnect:${couple_id}`;
        const existing = await redis.get(key);

        if (existing && existing !== userId) {
            // Both confirmed
            await query('UPDATE couples SET status=$1 WHERE id=$2', ['broken', couple_id]);
            await redis.del(key);
            return res.json({ message: '💔 Bond disconnected with mutual consent.' });
        }

        await redis.set(key, userId, { EX: 3600 });
        res.json({ message: 'Your disconnect request is noted. Waiting for partner confirmation...' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to disconnect' });
    }
};

// GET /api/bond/my-bond — Get my current bonded couple
const getMyBond = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await query(
            `SELECT c.*, 
        u1.name as user1_name, u1.avatar as user1_avatar,
        u2.name as user2_name, u2.avatar as user2_avatar
       FROM couples c
       JOIN users u1 ON c.user1_id = u1.id
       JOIN users u2 ON c.user2_id = u2.id
       WHERE (c.user1_id=$1 OR c.user2_id=$1) AND c.status = 'bonded'`,
            [userId]
        );
        res.json({ bond: result.rows[0] || null });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get bond' });
    }
};

module.exports = { sendRequest, acceptRequest, setPasscode, verifyLock, disconnect, getMyBond };
